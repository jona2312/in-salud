const { test } = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load-ts.cjs')
const session = id => ({ user: { id, email: `${id}@example.test` }, access_token: 'synthetic' })
function setup(overrides = {}) {
  let clears = 0, canceled = 0
  const auth = {
    signInWithPassword: async () => ({ data: { session: session('a'), user: session('a').user }, error: null }),
    signOut: async () => ({ error: null }), ...overrides,
  }
  const { useAuthStore } = load('stores/useAuthStore.ts', {
    '@/lib/supabase': { supabase: { auth } },
    '@/lib/queryClient': { clearPrivateCache: () => { clears++ } },
    '@/lib/notifications': { cancelAllReminders: async () => { canceled++ } },
  })
  return { store: useAuthStore, clears: () => clears, canceled: () => canceled }
}
test('restored session stays locked; token refresh preserves lock state', () => {
  const { store } = setup();store.getState().setSession(session('a'))
  assert.equal(store.getState().isLocked, true)
  store.getState().unlockApp();store.getState().setSession(session('a'))
  assert.equal(store.getState().isLocked, false)
  store.getState().lockAppNow();store.getState().setSession(session('a'))
  assert.equal(store.getState().isLocked, true)
})
test('account switch clears cache and requires identity verification', () => {
  const { store, clears } = setup();store.getState().setSession(session('a'));store.getState().unlockApp()
  const before = clears();store.getState().setSession(session('b'))
  assert.equal(clears(), before + 1);assert.equal(store.getState().isLocked, true)
})
test('offline logout locks synchronously and never reports a successful signout', async () => {
  let resolve
  const { store, canceled } = setup({ signOut: () => new Promise(r => { resolve = r }) })
  store.getState().setSession(session('a'));store.getState().unlockApp()
  const pending = store.getState().signOut();assert.equal(store.getState().isLocked, true)
  await Promise.resolve();resolve({ error: new Error('offline') });await pending
  assert.equal(store.getState().isLocked, true);assert.ok(store.getState().error);assert.equal(canceled(), 1)
})
test('successful logout clears session and cannot unlock anonymously', async () => {
  const { store } = setup();store.getState().setSession(session('a'));await store.getState().signOut();store.getState().unlockApp()
  assert.equal(store.getState().session, null);assert.equal(store.getState().isLocked, true)
})
test('failed password keeps restored account locked; verified password opens it', async () => {
  const fail = setup({ signInWithPassword: async () => ({ data: {}, error: new Error('bad') }) })
  fail.store.getState().setSession(session('a'));await fail.store.getState().signIn('a@example.test','bad');assert.equal(fail.store.getState().isLocked,true)
  const ok = setup();ok.store.getState().setSession(session('a'));await ok.store.getState().signIn('a@example.test','verified');assert.equal(ok.store.getState().isLocked,false)
})
test('private query cache cancels late old-account results', async () => {
  const { queryClient, clearPrivateCache } = load('lib/queryClient.ts')
  let resolve
  const pending = queryClient.fetchQuery({ queryKey:['persons'], queryFn:()=>new Promise(r=>{resolve=r}) }).catch(()=>{})
  clearPrivateCache();resolve(['old-person']);await pending
  assert.equal(queryClient.getQueryData(['persons']), undefined)
})
test('child write preflight denies missing session and inaccessible parent', async () => {
  const unauth = load('lib/ownedWrite.ts', { './supabase': { supabase: { auth: { getUser:async()=>({data:{user:null},error:null}) } } } })
  await assert.rejects(unauth.requireOwnedPerson('x'))
  const chain = { select(){return this}, eq(){return this}, async single(){return {data:null,error:null}} }
  const denied = load('lib/ownedWrite.ts', { './supabase': { supabase: { auth:{getUser:async()=>({data:{user:{id:'a'}},error:null})},from:()=>chain } } })
  await assert.rejects(denied.requireOwnedPerson('foreign-person'))
})
test('notifications contain no doctor or appointment title', async () => {
  let content
  const notifications = {setNotificationHandler(){},getPermissionsAsync:async()=>({status:'granted'}),SchedulableTriggerInputTypes:{DATE:'date'},scheduleNotificationAsync:async p=>{content=p.content;return 'id'}}
  const {scheduleAppointmentReminder}=load('lib/notifications.ts',{'expo-notifications':notifications,'react-native':{Platform:{OS:'android'}}})
  await scheduleAppointmentReminder({appointmentId:'demo',title:'PRIVATE',doctor:'PRIVATE',date:'2099-01-01',time:'10:00'})
  assert.equal(JSON.stringify(content).includes('PRIVATE'),false)
})
test('private routes never mount tabs before initialization or while locked', () => {
  const Tabs = () => {}; const Redirect = () => {}
  for (const state of [
    { isInitialized:false, session:null, isLocked:true },
    { isInitialized:true, session:null, isLocked:false },
    { isInitialized:true, session:session('a'), isLocked:true },
  ]) {
    const Layout = load('app/(tabs)/_layout.tsx', {
      'expo-router': { Tabs, Redirect },
      'react-native': { StyleSheet:{create:x=>x}, View:'View', Text:'Text' },
      '@/constants/theme': { COLORS:{} }, '@/stores/useAuthStore': { useAuthStore:()=>state },
    }).default
    assert.notEqual(Layout().type, Tabs)
  }
})
test('a pending password response cannot unlock after signout started', async () => {
  let resolve
  const { store }=setup({signInWithPassword:()=>new Promise(r=>{resolve=r})})
  const pending=store.getState().signIn('a@example.test','test-password')
  await store.getState().signOut()
  resolve({data:{session:session('a'),user:session('a').user},error:null});await pending
  assert.equal(store.getState().isLocked,true);assert.equal(store.getState().session,null)
})
