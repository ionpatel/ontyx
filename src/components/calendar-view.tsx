'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
} from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths
} from 'date-fns';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  color?: string;
  type?: string;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
}

const defaultColors: Record<string, string> = {
  appointment: 'bg-blue-500',
  invoice: 'bg-green-500',
  task: 'bg-orange-500',
  meeting: 'bg-purple-500',
  default: 'bg-primary',
};

export function CalendarView({ events, onEventClick, onDateClick }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = useMemo(() => 
    eachDayOfInterval({ start: calendarStart, end: calendarEnd }),
    [calendarStart, calendarEnd]
  );

  const getEventsForDay = (date: Date) => 
    events.filter(event => isSameDay(new Date(event.start), date));

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <div className="flex">
            <Button variant="ghost" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={day.toISOString()}
              onClick={() => onDateClick?.(day)}
              className={cn(
                'min-h-[100px] p-2 border-b border-r cursor-pointer transition-colors hover:bg-muted/50',
                !isCurrentMonth && 'bg-muted/30 text-muted-foreground',
                index % 7 === 6 && 'border-r-0'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  'text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full',
                  isCurrentDay && 'bg-primary text-primary-foreground'
                )}>
                  {format(day, 'd')}
                </span>
                {dayEvents.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{dayEvents.length - 3}
                  </Badge>
                )}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <button
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                    className={cn(
                      'w-full text-left px-2 py-0.5 rounded text-xs text-white truncate transition-opacity hover:opacity-80',
                      event.color || defaultColors[event.type || 'default'] || defaultColors.default
                    )}
                  >
                    {format(new Date(event.start), 'h:mm')} {event.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Mini Calendar for sidebar/widgets
export function MiniCalendar({ 
  selectedDate,
  onDateSelect,
  highlightDates = []
}: { 
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  highlightDates?: Date[];
}) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = useMemo(() => 
    eachDayOfInterval({ start: calendarStart, end: calendarEnd }),
    [calendarStart, calendarEnd]
  );

  const hasHighlight = (date: Date) => 
    highlightDates.some(d => isSameDay(d, date));

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-xs text-muted-foreground py-1">
            {day}
          </div>
        ))}
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentDay = isToday(day);
          const highlighted = hasHighlight(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect?.(day)}
              className={cn(
                'text-xs p-1 rounded-full transition-colors relative',
                !isCurrentMonth && 'text-muted-foreground/50',
                isCurrentMonth && 'hover:bg-muted',
                isSelected && 'bg-primary text-primary-foreground',
                isCurrentDay && !isSelected && 'font-bold text-primary'
              )}
            >
              {format(day, 'd')}
              {highlighted && !isSelected && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
