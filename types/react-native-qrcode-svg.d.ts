/**
 * Declaración de tipos para react-native-qrcode-svg
 * El paquete no incluye @types/ propio, así que lo declaramos mínimamente.
 */
declare module 'react-native-qrcode-svg' {
  import { Component } from 'react'

  interface QRCodeProps {
    value: string
    size?: number
    color?: string
    backgroundColor?: string
    logo?: { uri: string } | number
    logoSize?: number
    logoBackgroundColor?: string
    logoMargin?: number
    logoBorderRadius?: number
    quietZone?: number
    enableLinearGradient?: boolean
    linearGradient?: string[]
    gradientDirection?: string[]
    ecl?: 'L' | 'M' | 'Q' | 'H'
    onError?: (error: Error) => void
    getRef?: (ref: any) => void
  }

  export default class QRCode extends Component<QRCodeProps> {}
}
