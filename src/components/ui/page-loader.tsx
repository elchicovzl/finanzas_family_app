import { useTranslations } from '@/hooks/use-translations'

interface PageLoaderProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  fullScreen?: boolean
  className?: string
}

export function PageLoader({ 
  size = 'lg', 
  text, 
  fullScreen = true,
  className = '' 
}: PageLoaderProps) {
  const { t } = useTranslations()
  
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12', 
    lg: 'h-32 w-32'
  }
  
  const containerClasses = fullScreen 
    ? 'flex items-center justify-center min-h-screen'
    : 'flex items-center justify-center h-64'
  
  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="text-center">
        <div className={`animate-spin rounded-full ${sizeClasses[size]} border-b-2 border-gray-900 mx-auto mb-4`} />
        {text && (
          <p className="text-gray-600 text-sm">{text}</p>
        )}
        {!text && size === 'lg' && (
          <p className="text-gray-600 text-sm">{t('common.loading')}</p>
        )}
      </div>
    </div>
  )
}