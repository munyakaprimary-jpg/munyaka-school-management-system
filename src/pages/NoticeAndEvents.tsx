import { useState } from "react";
import { Calendar, momentLocalizer, View, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarPlus, MoreVertical, Trash2, MapPin, Clock, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";

const localizer = momentLocalizer(moment);

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  category: "academic" | "social" | "sports" | "meeting" | "other";
}

const categoryStyles: Record<CalendarEvent["category"], { bg: string; text: string; dot: string; label: string }> = {
  academic: { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500", label: "Academic" },
  social: { bg: "bg-pink-50", text: "text-pink-700", dot: "bg-pink-500", label: "Social" },
  sports: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Sports" },
  meeting: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Meeting" },
  other: { bg: "bg-slate-50", text: "text-slate-700", dot: "bg-slate-500", label: "Other" },
};

const initialEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "Midterm Exams Begin",
    description: "Midterm examination period for all faculties. Check the portal for your individual schedule.",
    start: new Date(2025, 9, 20, 9, 0),
    end: new Date(2025, 9, 20, 17, 0),
    location: "Examination Halls A, B, C",
    category: "academic",
  },
  {
    id: "2",
    title: "Tech Fest 2025",
    description: "Annual technology festival featuring hackathons, workshops, and guest speakers from leading companies.",
    start: new Date(2025, 9, 25, 10, 0),
    end: new Date(2025, 9, 27, 18, 0),
    location: "Main Auditorium & Open Grounds",
    category: "social",
  },
  {
    id: "3",
    title: "Inter-College Basketball",
    description: "Cheer for our team as they compete against North Valley College in the regional finals.",
    start: new Date(2025, 9, 22, 16, 0),
    end: new Date(2025, 9, 22, 19, 0),
    location: "Indoor Sports Complex",
    category: "sports",
  },
  {
    id: "4",
    title: "Faculty Senate Meeting",
    description: "Monthly review of academic policies, curriculum updates, and budget allocations.",
    start: new Date(2025, 8, 15, 14, 0),
    end: new Date(2025, 8, 15, 16, 30),
    location: "Senate Hall, Building 4",
    category: "meeting",
  },
  {
    id: "5",
    title: "Cultural Night",
    description: "An evening of music, dance, and drama performances celebrating diversity on campus.",
    start: new Date(2025, 10, 5, 19, 0),
    end: new Date(2025, 10, 5, 22, 0),
    location: "Open Air Theatre",
    category: "social",
  },
  {
    id: "6",
    title: "Library Closure Notice",
    description: "The central library will be closed for annual stock verification and maintenance.",
    start: new Date(2025, 8, 10, 0, 0),
    end: new Date(2025, 8, 12, 23, 59),
    location: "Central Library",
    category: "other",
  },
];

export default function NoticeAndEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState<Date>(new Date());
  const [open, setOpen] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formCategory, setFormCategory] = useState<CalendarEvent["category"]>("academic");

  // Confirmation dialog state for delete
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const eventToDelete = events.find((e) => e.id === pendingDeleteId);

  const sortedEvents = [...events].sort(
    (a, b) => b.start.getTime() - a.start.getTime()
  );

  const onDeleteEvent = (id: string) => {
    const event = events.find((e) => e.id === id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
    toast.success(`"${event?.title ?? "Event"}" has been removed`, {
      description: "The event has been deleted from your calendar.",
    });
  };

  const handleAddEvent = () => {
    if (!formTitle || !formStart || !formEnd) {
      toast.error("Please fill in the required fields");
      return;
    }

    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      title: formTitle,
      description: formDescription,
      start: new Date(formStart),
      end: new Date(formEnd),
      location: formLocation,
      category: formCategory,
    };

    setEvents((prev) => [...prev, newEvent]);
    toast.success("Event created", {
      description: `"${formTitle}" has been added to the calendar.`,
    });

    setFormTitle("");
    setFormDescription("");
    setFormStart("");
    setFormEnd("");
    setFormLocation("");
    setFormCategory("academic");
    setOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-amber-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-violet-600 mb-2">
              <CalendarIcon className="w-5 h-5" />
              <span className="text-sm font-semibold tracking-wide uppercase">Campus Calendar</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
              Notices & Events
            </h1>
            <p className="text-slate-600 mt-2 text-lg">
              Stay updated with everything happening across campus.
            </p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="rounded-full bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-200 px-6"
              >
                <CalendarPlus className="w-5 h-5 mr-2" />
                New Event
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>Create a new event</DialogTitle>
                <DialogDescription>
                  Add an event so the campus community stays in the loop.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Career Fair 2025"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Briefly describe the event..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="rounded-xl"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="start">Start</Label>
                    <Input
                      id="start"
                      type="datetime-local"
                      value={formStart}
                      onChange={(e) => setFormStart(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end">End</Label>
                    <Input
                      id="end"
                      type="datetime-local"
                      value={formEnd}
                      onChange={(e) => setFormEnd(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g. Main Auditorium"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formCategory}
                    onValueChange={(v) => setFormCategory(v as CalendarEvent["category"])}
                  >
                    <SelectTrigger id="category" className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                      <SelectItem value="sports">Sports</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-full">
                  Cancel
                </Button>
                <Button
                  onClick={handleAddEvent}
                  className="rounded-full bg-violet-600 hover:bg-violet-700"
                >
                  Create event
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Calendar */}
        <Card className="rounded-3xl border-slate-200/70 shadow-sm overflow-hidden">
          <CardContent className="p-2 md:p-4">
            <div className="h-[560px]">
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                view={view}
                onView={setView}
                date={date}
                onNavigate={setDate}
                views={[Views.MONTH, Views.WEEK, Views.AGENDA]}
                popup
                className="rounded-2xl"
                eventPropGetter={(event) => {
                  const style = categoryStyles[event.category];
                  return {
                    style: {
                      backgroundColor:
                        event.category === "academic"
                          ? "#6366f1"
                          : event.category === "social"
                          ? "#ec4899"
                          : event.category === "sports"
                          ? "#10b981"
                          : event.category === "meeting"
                          ? "#f59e0b"
                          : "#64748b",
                      border: "none",
                      borderRadius: "8px",
                      padding: "2px 6px",
                      fontSize: "12px",
                    },
                  };
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Event List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">All Events</h2>
              <p className="text-slate-500 text-sm mt-1">
                Sorted by most recent
              </p>
            </div>
            <Badge
              variant="secondary"
              className="rounded-full px-4 py-1.5 bg-violet-100 text-violet-700 hover:bg-violet-100 text-sm font-semibold"
              data-testid="event-counter"
            >
              {events.length} {events.length === 1 ? "Date" : "Dates"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedEvents.map((event, idx) => {
              const style = categoryStyles[event.category];
              const isPast = event.end.getTime() < Date.now();
              return (
                <Card
                  key={event.id}
                  data-testid="event-card"
                  className={`rounded-2xl border-slate-200/70 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 ${
                    isPast ? "opacity-75" : ""
                  }`}
                  style={{
                    animation: `fadeUp 0.4s ease-out ${idx * 60}ms both`,
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                          <Badge
                            variant="secondary"
                            className={`${style.bg} ${style.text} hover:${style.bg} rounded-full text-xs font-medium`}
                          >
                            {style.label}
                          </Badge>
                          {isPast && (
                            <Badge
                              variant="secondary"
                              className="rounded-full text-xs bg-slate-100 text-slate-600 hover:bg-slate-100"
                            >
                              Past
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg font-semibold text-slate-900 leading-tight">
                          {event.title}
                        </CardTitle>
                      </div>

                      {/* 3-dot menu with delete option */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 -mr-1 -mt-1"
                            aria-label="Event options"
                            data-testid="event-menu-trigger"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem
                            onClick={() => setPendingDeleteId(event.id)}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer rounded-lg"
                            data-testid="event-delete-option"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete event
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {event.description && (
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {event.description}
                      </p>
                    )}
                    <div className="flex flex-col gap-1.5 text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {moment(event.start).format("MMM D, YYYY · h:mm A")} —{" "}
                          {moment(event.end).format("h:mm A")}
                        </span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {events.length === 0 && (
            <Card className="rounded-2xl border-dashed border-slate-200 bg-slate-50/50">
              <CardContent className="py-12 text-center">
                <CalendarIcon className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">No events yet</p>
                <p className="text-slate-400 text-sm mt-1">
                  Create your first event to get started.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
      >
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete this event?</DialogTitle>
            <DialogDescription>
              {eventToDelete
                ? `"${eventToDelete.title}" will be permanently removed from the calendar. This action cannot be undone.`
                : "This event will be permanently removed."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setPendingDeleteId(null)}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (pendingDeleteId) onDeleteEvent(pendingDeleteId);
                setPendingDeleteId(null);
              }}
              className="rounded-full bg-red-600 hover:bg-red-700"
              data-testid="confirm-delete"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
