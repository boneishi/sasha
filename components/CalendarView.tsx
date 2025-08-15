import React, { useState, useMemo } from 'react';
import type { Appointment, Staff, Client, Quote, SystemSettings } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, CalendarIcon } from './icons';

interface CalendarViewProps {
    appointments: Appointment[];
    staff: Staff[];
    clients: Client[];
    quotes: Quote[];
    currentUser: Staff;
    onOpenAppointmentModal: (appointment: Appointment | null, prefilledClientId?: string) => void;
    navigateTo: (view: any) => void;
    systemSettings: SystemSettings;
}

const WEEK_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const CalendarView: React.FC<CalendarViewProps> = ({ appointments, staff, clients, quotes, currentUser, onOpenAppointmentModal, navigateTo, systemSettings }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
    const [selectedStaffId, setSelectedStaffId] = useState(currentUser.id);

    const { workingWeek, workingHoursStart, workingHoursEnd } = systemSettings;

    const daysToDisplay = useMemo(() => {
        if (viewMode === 'week') {
            const startOfWeek = new Date(currentDate);
            const day = startOfWeek.getDay();
            const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
            startOfWeek.setDate(diff);
            
            const allWeekDays = Array.from({ length: 7 }).map((_, i) => {
                const date = new Date(startOfWeek);
                date.setDate(date.getDate() + i);
                return date;
            });
            return allWeekDays.filter(day => workingWeek.includes(WEEK_DAYS[day.getDay()]));
        } else { // month view
            const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            const startDate = new Date(startOfMonth);
            const dayOfWeek = startDate.getDay();
            const diff = startDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            startDate.setDate(diff);

            const daysInCalendar = [];
            const tempDate = new Date(startDate);
            while (daysInCalendar.length < 42) {
                daysInCalendar.push(new Date(tempDate));
                tempDate.setDate(tempDate.getDate() + 1);
            }
            return daysInCalendar;
        }
    }, [currentDate, viewMode, workingWeek]);

    const filteredAppointments = useMemo(() => {
        if (selectedStaffId === 'all') return appointments;
        return appointments.filter(a => a.staffId === selectedStaffId);
    }, [appointments, selectedStaffId]);
    
    const handlePrev = () => {
        setCurrentDate(d => {
            const newDate = new Date(d);
            if (viewMode === 'week') {
                 newDate.setDate(d.getDate() - 7);
            } else {
                 newDate.setMonth(d.getMonth() - 1, 1);
            }
            return newDate;
        });
    };

    const handleNext = () => {
        setCurrentDate(d => {
            const newDate = new Date(d);
            if (viewMode === 'week') {
                 newDate.setDate(d.getDate() + 7);
            } else {
                 newDate.setMonth(d.getMonth() + 1, 1);
            }
            return newDate;
        });
    };

    const HOUR_HEIGHT_PX = 60;
    const hours = Array.from({ length: Math.max(0, workingHoursEnd - workingHoursStart) }, (_, i) => i + workingHoursStart);

    const getAppointmentPositionAndHeight = (appointment: Appointment) => {
        const start = new Date(appointment.start);
        const end = new Date(appointment.end);

        const startMinutes = (start.getHours() - workingHoursStart) * 60 + start.getMinutes();
        const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

        const top = (startMinutes / 60) * HOUR_HEIGHT_PX;
        const height = (durationMinutes / 60) * HOUR_HEIGHT_PX;

        return { top: `${top}px`, height: `${height}px` };
    };
    
    const getClientName = (client: Client) => {
        if (client.companyName) return client.companyName;
        const primaryContact = client.contacts.find(c => c.isPrimary);
        return primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}` : 'Unnamed Client';
    };

    const staffColors = ['bg-blue-200 border-blue-500 text-blue-900', 'bg-green-200 border-green-500 text-green-900', 'bg-purple-200 border-purple-500 text-purple-900', 'bg-yellow-200 border-yellow-500 text-yellow-900', 'bg-pink-200 border-pink-500 text-pink-900', 'bg-orange-200 border-orange-500 text-orange-900'];
    const getStaffColor = (staffId: string) => {
        const index = staff.findIndex(s => s.id === staffId);
        return staffColors[index % staffColors.length];
    }
    
    const ViewSwitcherButton: React.FC<{
        active: boolean;
        onClick: () => void;
        children: React.ReactNode;
    }> = ({ active, onClick, children }) => (
        <button onClick={onClick} className={`px-3 py-1.5 text-sm font-medium rounded-md ${active ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-gray-600'}`}>
            {children}
        </button>
    );

    const handleAppointmentClick = (appointment: Appointment) => {
        if (appointment.reason === 'Survey' && appointment.quoteId) {
            navigateTo({ view: 'surveyEditor', quoteId: appointment.quoteId });
        } else if (appointment.clientId) {
            navigateTo({ view: 'leadEditor', clientId: appointment.clientId });
        } else {
            // Fallback to original behavior if no context is available
            onOpenAppointmentModal(appointment, undefined);
        }
    };

    return (
        <div className="flex flex-col h-full bg-stone-50 dark:bg-gray-900">
            <header className="flex-shrink-0 bg-white dark:bg-gray-800 shadow-sm p-4 border-b border-stone-200 dark:border-gray-700 z-20">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <CalendarIcon className="w-8 h-8 text-stone-600 dark:text-stone-300"/>
                        <div>
                            <h1 className="text-xl font-bold text-stone-800 dark:text-stone-100">Calendar</h1>
                             <p className="text-sm text-stone-500 dark:text-stone-400">
                                {viewMode === 'week' && daysToDisplay.length > 0
                                    ? `${daysToDisplay[0].toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} - ${daysToDisplay[daysToDisplay.length - 1].toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`
                                    : currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
                                }
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={handlePrev} className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-gray-700"><ChevronLeftIcon className="w-5 h-5"/></button>
                        <button onClick={handleNext} className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-gray-700"><ChevronRightIcon className="w-5 h-5"/></button>
                        <div className="flex items-center p-1 bg-stone-100 dark:bg-gray-900 rounded-lg">
                            <ViewSwitcherButton active={viewMode === 'month'} onClick={() => setViewMode('month')}>Month</ViewSwitcherButton>
                            <ViewSwitcherButton active={viewMode === 'week'} onClick={() => setViewMode('week')}>Week</ViewSwitcherButton>
                        </div>
                        <select
                            value={selectedStaffId}
                            onChange={e => setSelectedStaffId(e.target.value)}
                            className="bg-stone-100 dark:bg-gray-700 border border-stone-200 dark:border-gray-600 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value={currentUser.id}>My Calendar</option>
                            <option value="all">All Users</option>
                             <optgroup label="Team Members">
                                {staff.filter(s => s.id !== currentUser.id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </optgroup>
                        </select>
                        <button onClick={() => onOpenAppointmentModal(null, undefined)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700">
                            <PlusIcon className="w-5 h-5"/> New Appointment
                        </button>
                    </div>
                </div>
            </header>

            {viewMode === 'week' ? (
                <div className="flex-grow flex flex-col overflow-hidden">
                    {/* Header Row */}
                    <div className="flex-shrink-0 flex border-b border-stone-200 dark:border-gray-700">
                        <div className="w-16 flex-shrink-0" /> {/* Time gutter placeholder */}
                        <div className="flex-grow grid" style={{ gridTemplateColumns: `repeat(${daysToDisplay.length}, minmax(0, 1fr))` }}>
                            {daysToDisplay.map(day => (
                                <div key={day.toISOString()} className="text-center py-2 border-l border-stone-200 dark:border-gray-700">
                                    <p className="text-sm font-medium text-stone-500 dark:text-stone-400">{day.toLocaleDateString(undefined, { weekday: 'short' })}</p>
                                    <p className="text-lg font-bold text-stone-800 dark:text-stone-100">{day.getDate()}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Scrollable Body */}
                    <div className="flex-grow flex overflow-auto">
                        {/* Time Gutter */}
                        <div className="w-16 flex-shrink-0 text-xs text-right text-stone-500 dark:text-stone-400">
                            <div className="relative">
                                {hours.map((hour) => (
                                    <div key={hour} style={{ height: `${HOUR_HEIGHT_PX}px` }} className="-mt-2.5 pr-2 pt-[14px]">
                                        {hour > 0 && <span>{hour > 12 ? hour - 12 : hour}{hour >= 12 ? 'pm' : 'am'}</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Main Grid */}
                        <div className="flex-grow grid" style={{ gridTemplateColumns: `repeat(${daysToDisplay.length}, minmax(0, 1fr))` }}>
                            {daysToDisplay.map(day => (
                                <div key={day.toISOString()} className="border-l border-stone-200 dark:border-gray-700 relative">
                                    {/* Grid Lines */}
                                    {hours.map(hour => (
                                        <div key={hour} style={{ height: `${HOUR_HEIGHT_PX}px` }} className="border-b border-stone-200 dark:border-gray-700" />
                                    ))}
                                    {/* Appointments */}
                                    <div className="absolute inset-0">
                                        {filteredAppointments
                                            .filter(a => new Date(a.start).toDateString() === day.toDateString())
                                            .map(appointment => {
                                                const { top, height } = getAppointmentPositionAndHeight(appointment);
                                                const client = clients.find(c => c.id === appointment.clientId);
                                                const appointmentStaff = staff.find(s => s.id === appointment.staffId);
                                                return (
                                                    <div 
                                                        key={appointment.id} 
                                                        onClick={() => handleAppointmentClick(appointment)}
                                                        className={`absolute w-full px-2 py-1 rounded shadow-sm border-l-4 cursor-pointer overflow-hidden ${getStaffColor(appointment.staffId)}`}
                                                        style={{ top, height, minHeight: '2rem' }}>
                                                        <p className="font-bold text-xs truncate">{appointment.title}</p>
                                                        {client && <p className="text-xs truncate">{getClientName(client)}</p>}
                                                        {selectedStaffId === 'all' && appointmentStaff && (
                                                            <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-black/20 text-white text-xs font-bold flex items-center justify-center" title={appointmentStaff.name}>
                                                                {appointmentStaff.initials}
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <main className="flex-grow grid grid-cols-7 grid-rows-6 overflow-hidden border-t border-stone-200 dark:border-gray-700">
                    {daysToDisplay.map((day) => {
                        const isToday = day.toDateString() === new Date().toDateString();
                        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                        const dayAppointments = filteredAppointments.filter(a => new Date(a.start).toDateString() === day.toDateString());
                        return (
                            <div key={day.toISOString()} className={`border-r border-b border-stone-200 dark:border-gray-700 p-2 flex flex-col ${isCurrentMonth ? 'bg-white dark:bg-gray-800/50' : 'bg-stone-50 dark:bg-gray-800/20'}`}>
                                <p className={`text-sm font-bold ${isCurrentMonth ? 'text-stone-700 dark:text-stone-200' : 'text-stone-400 dark:text-stone-500'} ${isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>
                                    {day.getDate()}
                                </p>
                                <div className="mt-1 space-y-1 overflow-y-auto">
                                    {dayAppointments.map(appointment => (
                                        <div 
                                            key={appointment.id}
                                            onClick={() => handleAppointmentClick(appointment)}
                                            className={`p-1 rounded-sm text-xs cursor-pointer truncate ${getStaffColor(appointment.staffId)}`}
                                            title={appointment.title}
                                        >
                                           {appointment.title}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </main>
            )}
        </div>
    );
};