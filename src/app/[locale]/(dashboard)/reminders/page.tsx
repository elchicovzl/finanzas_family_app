'use client'

import { useEffect, useState } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'moment/locale/es'
import 'moment/locale/en-gb'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Calendar as CalendarIcon, List, CheckCircle, Clock, AlertTriangle, RefreshCw, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import ReminderModal from '@/components/ReminderModal'
import { useTranslations } from '@/hooks/use-translations'
import { PageLoader } from '@/components/ui/page-loader'

// Set moment locale dynamically
const localizer = momentLocalizer(moment)

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  allDay: boolean
  resource: {
    id: string
    description?: string
    amount?: number
    formattedAmount?: string
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    isCompleted: boolean
    isRecurring: boolean
    recurrenceType?: string
    category?: {
      name: string
      icon: string
      color: string
    }
    isNotified: boolean
    daysUntilDue: number
  }
}

interface Reminder {
  id: string
  title: string
  description?: string
  amount?: number
  formattedAmount?: string
  dueDate: string
  formattedDueDate: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  isCompleted: boolean
  isRecurring: boolean
  recurrenceType?: string
  category?: {
    name: string
    icon: string
    color: string
  }
  isNotified: boolean
  daysUntilDue: number
}

export default function RemindersPage() {
  const { locale, t } = useTranslations()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | undefined>(undefined)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day' | 'agenda'>('month')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [summary, setSummary] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    notified: 0,
    recurring: 0
  })

  const formatCurrency = (amount: number) => {
    const localeCode = locale === 'es' ? 'es-CO' : 'en-US'
    return new Intl.NumberFormat(localeCode, {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  useEffect(() => {
    // Set moment locale based on current locale
    const momentLocale = locale === 'es' ? 'es' : 'en-gb'
    moment.locale(momentLocale)
    fetchReminders()
    fetchCalendarEvents()
  }, [locale])

  useEffect(() => {
    // Detect mobile device using User Agent and screen size
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const isMobileUserAgent = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
      const isMobileScreen = window.innerWidth <= 768 || window.screen.width <= 768
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      
      // Consider it mobile if any of these conditions are true
      const mobile = isMobileUserAgent || (isMobileScreen && isTouchDevice)
      
      setIsMobile(mobile)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const fetchReminders = async () => {
    try {
      const response = await fetch('/api/reminders?upcoming=true')
      if (response.ok) {
        const data = await response.json()
        setReminders(data.reminders)
      }
    } catch (error) {
      console.error('Error fetching reminders:', error)
      toast.error(t('messages.errorLoadingReminders'))
    }
  }

  const fetchCalendarEvents = async () => {
    try {
      const response = await fetch('/api/reminders/calendar')
      if (response.ok) {
        const data = await response.json()
        const formattedEvents = data.events.map((event: CalendarEvent) => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end)
        }))
        setEvents(formattedEvents)
        setSummary(data.summary)
      }
    } catch (error) {
      console.error('Error fetching calendar events:', error)
      toast.error(t('messages.errorLoadingCalendar'))
    } finally {
      setLoading(false)
    }
  }

  const markAsCompleted = async (reminderId: string) => {
    try {
      const response = await fetch(`/api/reminders/${reminderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isCompleted: true })
      })

      if (response.ok) {
        toast.success(t('messages.reminderMarkedCompleted'))
        fetchReminders()
        fetchCalendarEvents()
      } else {
        toast.error(t('messages.errorCompletingReminder'))
      }
    } catch (error) {
      console.error('Error marking reminder as completed:', error)
      toast.error(t('messages.errorCompletingReminder'))
    }
  }

  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder)
    setShowModal(true)
  }

  const handleDeleteReminder = async (reminderId: string) => {
    if (!confirm(t('reminders.confirmDeleteReminder'))) {
      return
    }

    try {
      const response = await fetch(`/api/reminders/${reminderId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success(t('messages.reminderDeleted'))
        fetchReminders()
        fetchCalendarEvents()
      } else {
        toast.error(t('messages.errorDeletingReminder'))
      }
    } catch (error) {
      console.error('Error deleting reminder:', error)
      toast.error(t('messages.errorDeletingReminder'))
    }
  }

  const handleModalSuccess = () => {
    fetchReminders()
    fetchCalendarEvents()
    setEditingReminder(undefined)
  }

  const handleNewReminder = () => {
    setEditingReminder(undefined)
    setSelectedDate(null)
    setShowModal(true)
  }

  // Calendar navigation handlers
  const handleNavigate = (action: Date | 'PREV' | 'NEXT' | 'TODAY') => {
    if (action === 'PREV') {
      const newDate = new Date(currentDate)
      newDate.setMonth(newDate.getMonth() - 1)
      setCurrentDate(newDate)
    } else if (action === 'NEXT') {
      const newDate = new Date(currentDate)
      newDate.setMonth(newDate.getMonth() + 1)
      setCurrentDate(newDate)
    } else if (action === 'TODAY') {
      setCurrentDate(new Date())
    } else {
      setCurrentDate(action as Date)
    }
  }

  const handleViewChange = (view: any) => {
    setCurrentView(view as 'month' | 'week' | 'day' | 'agenda')
  }

  // Calendar interaction handlers
  const handleSelectEvent = (event: CalendarEvent) => {
    console.log('📅 Calendar event clicked:', event.title, 'ID:', event.resource.id)
    
    // Find the full reminder data from the reminders array first
    let fullReminder = reminders.find(r => r.id === event.resource.id)
    
    // If not found in reminders array, create a reminder object from the calendar event
    if (!fullReminder) {
      console.log('🔄 Creating reminder object from calendar event')
      const resource = event.resource
      fullReminder = {
        id: resource.id,
        title: event.title,
        description: resource.description || '',
        amount: resource.amount || undefined,
        formattedAmount: resource.formattedAmount || undefined,
        dueDate: event.start,
        formattedDueDate: new Intl.DateTimeFormat(locale === 'es' ? 'es-CO' : 'en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }).format(event.start),
        priority: resource.priority,
        isCompleted: resource.isCompleted,
        isRecurring: resource.isRecurring,
        recurrenceType: resource.recurrenceType || undefined,
        category: resource.category || undefined,
        isNotified: resource.isNotified,
        daysUntilDue: resource.daysUntilDue,
        notifyDaysBefore: 1, // Default value
        isActive: true,
        familyId: '', // Will be filled by the API
        createdByUserId: '', // Will be filled by the API
        createdAt: new Date(),
        updatedAt: new Date(),
        lastNotified: resource.isNotified ? new Date() : null,
        completedAt: resource.isCompleted ? new Date() : null,
        endDate: null,
        recurrenceInterval: null
      } as Reminder
    } else {
      console.log('✅ Found reminder in array:', fullReminder.title)
    }
    
    if (fullReminder) {
      console.log('🚀 Opening edit modal for:', fullReminder.title)
      handleEditReminder(fullReminder)
    } else {
      console.error('❌ No reminder data found')
    }
  }

  const handleSelectSlot = ({ start }: { start: Date }) => {
    // Don't allow creating reminders for past dates
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (start < today) {
      toast.error(t('reminders.cannotCreatePastReminders'))
      return
    }
    
    // When clicking on a day, open modal with that date pre-selected
    setSelectedDate(start)
    setEditingReminder(undefined)
    setShowModal(true)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-green-100 text-green-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'URGENT': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'LOW': return t('reminders.priorityLow')
      case 'MEDIUM': return t('reminders.priorityMedium')
      case 'HIGH': return t('reminders.priorityHigh')
      case 'URGENT': return t('reminders.priorityUrgent')
      default: return priority
    }
  }

  const eventStyleGetter = (event: CalendarEvent) => {
    const { resource } = event
    let backgroundColor = '#3174ad'
    
    if (resource.isCompleted) {
      backgroundColor = '#10b981'
    } else if (resource.isNotified) {
      backgroundColor = '#ef4444'
    } else if (resource.priority === 'URGENT') {
      backgroundColor = '#dc2626'
    } else if (resource.priority === 'HIGH') {
      backgroundColor = '#ea580c'
    } else if (resource.priority === 'MEDIUM') {
      backgroundColor = '#d97706'
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: resource.isCompleted ? 0.6 : 1,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    }
  }

  if (loading) {
    return <PageLoader />
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{t('reminders.title')}</h1>
          <p className="text-muted-foreground">
            {t('reminders.description')}
          </p>
        </div>
        <Button className="text-white cursor-pointer" onClick={handleNewReminder}>
          <Plus className="w-4 h-4 mr-2" />
          {t('reminders.newReminder')}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{t('reminders.total')}</CardTitle>
            <List className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{summary.total}</div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{t('reminders.completed')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">{summary.completed}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{t('reminders.pending')}</CardTitle>
            <Clock className="h-4 w-4 text-blue-600 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{summary.pending}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{t('reminders.notified')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-red-600">{summary.notified}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow col-span-2 sm:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{t('reminders.recurring')}</CardTitle>
            <RefreshCw className="h-4 w-4 text-purple-600 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-purple-600">{summary.recurring}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar">
            <CalendarIcon className="w-4 h-4 mr-2" />
            {t('reminders.calendar')}
          </TabsTrigger>
          <TabsTrigger value="list">
            <List className="w-4 h-4 mr-2" />
            {t('reminders.list')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('reminders.calendarView')}</CardTitle>
              <CardDescription>
                {t('reminders.visualizeReminders')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isMobile && (
                <div className="space-y-3 mb-4 pb-4 border-b">
                  {/* View selector for mobile */}
                  <div className="flex justify-center mb-3">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <Button
                        variant={currentView === 'month' ? 'default' : 'ghost'}
                        size="sm"
                        className="px-3 py-1 text-xs"
                        onClick={() => setCurrentView('month')}
                      >
                        📅 Mes
                      </Button>
                      <Button
                        variant={currentView === 'agenda' ? 'default' : 'ghost'}
                        size="sm"
                        className="px-3 py-1 text-xs"
                        onClick={() => setCurrentView('agenda')}
                      >
                        📋 Lista
                      </Button>
                    </div>
                  </div>
                  
                  {/* Navigation */}
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      className="touch-manipulation px-3 py-2"
                      onClick={() => handleNavigate('PREV')}
                    >
                      ← Ant
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="touch-manipulation px-3 py-2"
                      onClick={() => handleNavigate('TODAY')}
                    >
                      Hoy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="touch-manipulation px-3 py-2"
                      onClick={() => handleNavigate('NEXT')}
                    >
                      Sig →
                    </Button>
                  </div>
                  <h3 className="font-semibold text-center text-base">
                    {moment(currentDate).format('MMMM YYYY')}
                  </h3>
                </div>
              )}
              <div style={{ height: isMobile ? '400px' : '600px', width: '100%' }}>
                <Calendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ 
                    height: '100%', 
                    width: '100%',
                    fontSize: isMobile ? '12px' : '16px'
                  }}
                  date={currentDate}
                  view={currentView}
                  onNavigate={handleNavigate}
                  onView={handleViewChange}
                  onSelectEvent={handleSelectEvent}
                  onSelectSlot={handleSelectSlot}
                  selectable={true}
                  eventPropGetter={eventStyleGetter}
                  popup={false}
                  views={isMobile ? ['month', 'agenda'] : ['month', 'week', 'day', 'agenda']}
                  toolbar={!isMobile}
                  step={30}
                  timeslots={2}
                  messages={{
                    next: t('reminders.next'),
                    previous: t('reminders.previous'),
                    today: t('reminders.today'),
                    month: t('reminders.month'),
                    week: t('reminders.week'),
                    day: t('reminders.day'),
                    agenda: t('reminders.agenda'),
                    date: t('reminders.date'),
                    time: t('reminders.time'),
                    event: t('reminders.event'),
                    allDay: t('reminders.allDay'),
                    work_week: t('reminders.workWeek'),
                    yesterday: t('reminders.yesterday'),
                    tomorrow: t('reminders.tomorrow'),
                    noEventsInRange: t('reminders.noEventsInRange'),
                    showMore: (total) => t('reminders.showMore', { count: total })
                  }}
                  formats={{
                    monthHeaderFormat: 'MMMM YYYY',
                    dayHeaderFormat: 'dddd, DD MMMM',
                    dayRangeHeaderFormat: ({ start, end }) =>
                      `${moment(start).format('DD/MM')} - ${moment(end).format('DD/MM')}`,
                    agendaHeaderFormat: ({ start, end }) =>
                      `${moment(start).format('DD MMM YYYY')} - ${moment(end).format('DD MMM YYYY')}`,
                    dayFormat: 'DD',
                    dateFormat: 'DD',
                    weekdayFormat: 'dddd',
                    timeGutterFormat: 'HH:mm',
                    agendaDateFormat: 'dddd DD MMM',
                    agendaTimeFormat: 'HH:mm',
                    agendaTimeRangeFormat: ({ start, end }) =>
                      `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`
                  }}
                  culture={locale === 'es' ? 'es' : 'en-GB'}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('reminders.listView')}</CardTitle>
              <CardDescription>
                {t('reminders.upcomingOverdueReminders')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reminders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <List className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {t('reminders.noUpcomingReminders')}
                    </p>
                  </div>
                ) : (
                  reminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className={`border rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all duration-200 active:scale-98 ${
                        reminder.isNotified ? 'border-red-200 bg-red-50' : 
                        reminder.daysUntilDue === 0 ? 'border-yellow-200 bg-yellow-50' :
                        reminder.daysUntilDue < 0 ? 'border-red-300 bg-red-100' :
                        'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleEditReminder(reminder)}
                    >
                      <div className="space-y-3">
                        {/* Header with title and priority */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg leading-tight truncate">
                              {reminder.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge 
                              className={`${getPriorityColor(reminder.priority)} text-xs px-2 py-1`}
                              variant="secondary"
                            >
                              {getPriorityLabel(reminder.priority)}
                            </Badge>
                            {reminder.isRecurring && (
                              <Badge variant="outline" className="text-xs px-2 py-1">
                                <RefreshCw className="w-3 h-3 mr-1" />
                                {t('reminders.recurring')}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* Description */}
                        {reminder.description && (
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {reminder.description}
                          </p>
                        )}

                        {/* Details grid - responsive */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="text-base">📅</span>
                            <span className="font-medium">{reminder.formattedDueDate}</span>
                          </div>
                          
                          {reminder.amount && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <span className="text-base">💰</span>
                              <span className="font-medium">{formatCurrency(reminder.amount)}</span>
                            </div>
                          )}
                          
                          {reminder.category && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <span className="text-base">{reminder.category.icon}</span>
                              <span className="font-medium">{reminder.category.name}</span>
                            </div>
                          )}
                          
                          <div className={`flex items-center gap-2 font-semibold ${
                            reminder.isNotified ? 'text-red-600' :
                            reminder.daysUntilDue === 0 ? 'text-yellow-600' :
                            reminder.daysUntilDue < 0 ? 'text-red-700' :
                            'text-blue-600'
                          }`}>
                            <span className="text-base">⏰</span>
                            <span className="text-sm">
                              {reminder.isNotified 
                                ? t('reminders.notifiedDaysAgo', { days: Math.abs(reminder.daysUntilDue) })
                                : reminder.daysUntilDue === 0
                                ? t('reminders.dueToday')
                                : reminder.daysUntilDue === 1
                                ? t('reminders.dueTomorrow')
                                : reminder.daysUntilDue < 0
                                ? `Vencido hace ${Math.abs(reminder.daysUntilDue)} días`
                                : t('reminders.dueInDays', { days: reminder.daysUntilDue })
                              }
                            </span>
                          </div>
                        </div>

                        {/* Actions - responsive layout */}
                        <div className="flex gap-2 pt-2 border-t border-gray-200">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 sm:flex-none touch-manipulation"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditReminder(reminder)
                            }}
                          >
                            <Edit className="w-4 h-4 sm:mr-2" />
                            <span className="hidden sm:inline">Editar</span>
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 sm:flex-none touch-manipulation text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteReminder(reminder.id)
                            }}
                          >
                            <Trash2 className="w-4 h-4 sm:mr-2" />
                            <span className="hidden sm:inline">Eliminar</span>
                          </Button>
                          
                          <Button
                            size="sm"
                            className="flex-1 sm:flex-none touch-manipulation"
                            onClick={(e) => {
                              e.stopPropagation()
                              markAsCompleted(reminder.id)
                            }}
                            disabled={reminder.isCompleted}
                          >
                            <CheckCircle className="w-4 h-4 sm:mr-1" />
                            <span className="hidden sm:inline">{t('reminders.complete')}</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ReminderModal
        isOpen={showModal}
        onOpenChange={setShowModal}
        onSuccess={handleModalSuccess}
        editingReminder={editingReminder}
        selectedDate={selectedDate}
      />
    </div>
  )
}