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
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day' | 'agenda'>('month')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
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
    setEditingReminder(null)
  }

  const handleNewReminder = () => {
    setEditingReminder(null)
    setSelectedDate(null)
    setShowModal(true)
  }

  // Calendar navigation handlers
  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate)
  }

  const handleViewChange = (view: 'month' | 'week' | 'day' | 'agenda') => {
    setCurrentView(view)
  }

  // Calendar interaction handlers
  const handleSelectEvent = (event: CalendarEvent) => {
    // Find the full reminder data
    const fullReminder = reminders.find(r => r.id === event.resource.id)
    if (fullReminder) {
      handleEditReminder(fullReminder)
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
    setEditingReminder(null)
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
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
        <Button onClick={handleNewReminder}>
          <Plus className="w-4 h-4 mr-2" />
          {t('reminders.newReminder')}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('reminders.total')}</CardTitle>
            <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('reminders.completed')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('reminders.pending')}</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summary.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('reminders.notified')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.notified}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('reminders.recurring')}</CardTitle>
            <RefreshCw className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{summary.recurring}</div>
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
              <div style={{ height: '600px' }}>
                <Calendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: '100%' }}
                  date={currentDate}
                  view={currentView}
                  onNavigate={handleNavigate}
                  onView={handleViewChange}
                  onSelectEvent={handleSelectEvent}
                  onSelectSlot={handleSelectSlot}
                  selectable={true}
                  eventPropGetter={eventStyleGetter}
                  popup={true}
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
                    dayHeaderFormat: 'dddd DD/MM',
                    dayRangeHeaderFormat: ({ start, end }) =>
                      `${moment(start).format('DD/MM')} - ${moment(end).format('DD/MM')}`,
                    agendaHeaderFormat: ({ start, end }) =>
                      `${moment(start).format('DD MMM YYYY')} - ${moment(end).format('DD MMM YYYY')}`,
                    dayFormat: 'DD',
                    dateFormat: 'DD',
                    weekdayFormat: 'dddd',
                    timeGutterFormat: 'HH:mm',
                    monthYearFormat: 'MMMM YYYY',
                    dayHeaderFormat: 'dddd, DD MMMM',
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
              <div className="space-y-4">
                {reminders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {t('reminders.noUpcomingReminders')}
                  </p>
                ) : (
                  reminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className={`border rounded-lg p-4 ${
                        reminder.isNotified ? 'border-red-200 bg-red-50' : 
                        reminder.daysUntilDue === 0 ? 'border-yellow-200 bg-yellow-50' :
                        'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{reminder.title}</h3>
                            <Badge className={getPriorityColor(reminder.priority)}>
                              {getPriorityLabel(reminder.priority)}
                            </Badge>
                            {reminder.isRecurring && (
                              <Badge variant="outline">
                                <RefreshCw className="w-3 h-3 mr-1" />
                                {t('reminders.recurring')}
                              </Badge>
                            )}
                          </div>
                          
                          {reminder.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {reminder.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>📅 {reminder.formattedDueDate}</span>
                            {reminder.amount && (
                              <span>💰 {formatCurrency(reminder.amount)}</span>
                            )}
                            {reminder.category && (
                              <span>
                                {reminder.category.icon} {reminder.category.name}
                              </span>
                            )}
                            <span className={
                              reminder.isNotified ? 'text-red-600 font-medium' :
                              reminder.daysUntilDue === 0 ? 'text-yellow-600 font-medium' :
                              'text-blue-600'
                            }>
                              {reminder.isNotified 
                                ? t('reminders.notifiedDaysAgo', { days: Math.abs(reminder.daysUntilDue) })
                                : reminder.daysUntilDue === 0
                                ? t('reminders.dueToday')
                                : reminder.daysUntilDue === 1
                                ? t('reminders.dueTomorrow')
                                : t('reminders.dueInDays', { days: reminder.daysUntilDue })
                              }
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditReminder(reminder)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteReminder(reminder.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => markAsCompleted(reminder.id)}
                            disabled={reminder.isCompleted}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            {t('reminders.complete')}
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