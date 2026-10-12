export interface Theme {
  bg: string
  surface: string
  surfaceHover: string
  sidebar: string
  sidebarBorder: string
  sidebarText: string
  sidebarMuted: string
  sidebarActive: string
  sidebarActiveText: string
  sidebarActiveBg: string
  primary: string
  primaryHover: string
  primaryLight: string
  primaryBg: string
  primaryBgHover: string
  secondary: string
  secondaryBg: string
  fg: string
  fgSecondary: string
  muted: string
  mutedLight: string
  border: string
  borderLight: string
  tableHeader: string
  success: string
  successBg: string
  successText: string
  warning: string
  warningBg: string
  warningText: string
  danger: string
  dangerBg: string
  dangerText: string
  info: string
  infoBg: string
  infoText: string
  purple: string
  purpleBg: string
  gradientLeft: string
  gradientRight: string
  cardShadow: string
  cardShadowHover: string
  isDark: boolean
}

export const LIGHT: Theme = {
  bg: '#FAFAF7',
  surface: '#FFFFFF',
  surfaceHover: '#F5F4F0',
  sidebar: '#2C2C2C',
  sidebarBorder: 'rgba(255,255,255,0.06)',
  sidebarText: '#94A3B8',
  sidebarMuted: '#64748B',
  sidebarActive: 'rgba(45,106,79,0.28)',
  sidebarActiveText: '#fff',
  sidebarActiveBg: '#52B788',
  primary: '#2D6A4F',
  primaryHover: '#245941',
  primaryLight: '#52B788',
  primaryBg: '#E8F5EE',
  primaryBgHover: '#D5EDDF',
  secondary: '#C65D3B',
  secondaryBg: '#FAE8E2',
  fg: '#1A1A1A',
  fgSecondary: '#374151',
  muted: '#6B7280',
  mutedLight: '#9CA3AF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  tableHeader: '#F9FAFB',
  success: '#22C55E',
  successBg: '#F0FDF4',
  successText: '#16A34A',
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  warningText: '#D97706',
  danger: '#EF4444',
  dangerBg: '#FEF2F2',
  dangerText: '#DC2626',
  info: '#3B82F6',
  infoBg: '#EFF6FF',
  infoText: '#2563EB',
  purple: '#8B5CF6',
  purpleBg: '#F5F3FF',
  gradientLeft: 'linear-gradient(160deg, #1A1A1A 0%, #2C2C2C 40%, #1A3D2B 100%)',
  gradientRight: '#FAFAF7',
  cardShadow: '0 1px 3px rgba(0,0,0,0.04)',
  cardShadowHover: '0 4px 12px rgba(0,0,0,0.08)',
  isDark: false,
}

export const DARK: Theme = {
  bg: '#121212',
  surface: '#1E1E1E',
  surfaceHover: '#252525',
  sidebar: '#1B4332',
  sidebarBorder: 'rgba(255,255,255,0.08)',
  sidebarText: '#A7C4B0',
  sidebarMuted: '#74A584',
  sidebarActive: 'rgba(64,145,108,0.3)',
  sidebarActiveText: '#fff',
  sidebarActiveBg: '#40916C',
  primary: '#40916C',
  primaryHover: '#2D6A4F',
  primaryLight: '#74C69D',
  primaryBg: '#1A3A29',
  primaryBgHover: '#1E4530',
  secondary: '#D97757',
  secondaryBg: '#3A1F14',
  fg: '#F5F5F5',
  fgSecondary: '#E5E7EB',
  muted: '#9CA3AF',
  mutedLight: '#6B7280',
  border: '#2D2D2D',
  borderLight: '#242424',
  tableHeader: '#191919',
  success: '#4ADE80',
  successBg: '#1A3A1A',
  successText: '#4ADE80',
  warning: '#FBBF24',
  warningBg: '#3A2800',
  warningText: '#FBBF24',
  danger: '#F87171',
  dangerBg: '#3A1A1A',
  dangerText: '#F87171',
  info: '#60A5FA',
  infoBg: '#1A2840',
  infoText: '#60A5FA',
  purple: '#A78BFA',
  purpleBg: '#2A1F40',
  gradientLeft: 'linear-gradient(160deg, #0A1F14 0%, #1B4332 40%, #0D3321 100%)',
  gradientRight: '#121212',
  cardShadow: '0 1px 3px rgba(0,0,0,0.3)',
  cardShadowHover: '0 4px 16px rgba(0,0,0,0.4)',
  isDark: true,
}
