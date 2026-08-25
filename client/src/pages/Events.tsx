import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export function Events() {
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [calendarMode, setCalendarMode] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: new Date().toISOString().split("T")[0],
    location: "",
    isOnline: false,
  });

  const { data: upcomingEvents, isLoading: loadingEvents } = trpc.events.getUpcomingEvents.useQuery({
    limit: 20,
  });

  const utils = trpc.useUtils();
  const createEventMutation = trpc.events.createEvent.useMutation({ onSuccess: async () => { await utils.events.getUpcomingEvents.invalidate(); toast.success("Event created."); }, onError: () => toast.error("Could not create the event. Please try again.") });
  const rsvpEventMutation = trpc.events.rsvpEvent.useMutation({ onSuccess: () => toast.success("Your RSVP was saved."), onError: () => toast.error("Could not save your RSVP. Please try again.") });

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEventMutation.mutateAsync({
        title: formData.title,
        description: formData.description,
        startDate: new Date(formData.startDate),
        location: formData.location,
        isOnline: formData.isOnline,
      });
      setFormData({
        title: "",
        description: "",
        startDate: new Date().toISOString().split("T")[0],
        location: "",
        isOnline: false,
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to create event:", error);
    }
  };

  const handleRSVP = async (eventId: number, status: "going" | "interested" | "not_going") => {
    try {
      await rsvpEventMutation.mutateAsync({ eventId, status });
    } catch (error) {
      console.error("Failed to RSVP:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Events</h1>
          <p className="text-purple-200">Discover and create events</p>
        </div>

        {/* Create Event Button */}
        {user && (
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="mb-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {showCreateForm ? "Cancel" : "Create Event"}
          </Button>
        )}

        {/* Create Event Form */}
        {showCreateForm && (
          <Card className="mb-8 p-6 bg-slate-800 border-purple-500">
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Event Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter event title"
                  className="bg-slate-700 border-purple-500 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter event description"
                  className="w-full bg-slate-700 border border-purple-500 text-white rounded p-2"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">Start Date</label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="bg-slate-700 border-purple-500 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">Location</label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Enter location"
                    className="bg-slate-700 border-purple-500 text-white"
                  />
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isOnline}
                  onChange={(e) => setFormData({ ...formData, isOnline: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-purple-200">Online Event</label>
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                disabled={createEventMutation.isPending}
              >
                {createEventMutation.isPending ? "Creating..." : "Create Event"}
              </Button>
            </form>
          </Card>
        )}

        {/* Upcoming Events */}
        <div>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 className="text-2xl font-bold text-white">Upcoming Events</h2><Button type="button" variant="outline" onClick={() => setCalendarMode((current) => !current)} className="w-fit border-purple-300/30 bg-transparent text-purple-100 hover:bg-white/10">{calendarMode ? "List view" : "Calendar view"}</Button></div>
          {loadingEvents ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <Card key={item} className="h-44 animate-pulse border-purple-500/30 bg-slate-800" />)}</div>
          ) : upcomingEvents && upcomingEvents.length > 0 ? calendarMode ? (
            <div className="space-y-4" aria-label="Upcoming events calendar"><p className="text-sm text-purple-200">Events grouped by their local calendar date.</p>{Object.entries((upcomingEvents ?? []).reduce<Record<string, any[]>>((groups, event) => { const key = new Date(event.startDate).toLocaleDateString(); (groups[key] ??= []).push(event); return groups; }, {})).map(([date, eventsForDate]) => <Card key={date} className="border-purple-500/40 bg-slate-800 p-4"><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold text-white">{date}</h3><span className="text-xs text-purple-300">{eventsForDate.length} event{eventsForDate.length === 1 ? "" : "s"}</span></div><div className="space-y-2">{eventsForDate.map((event) => <div key={event.id} className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium text-white">{event.title}</p><p className="text-xs text-purple-200">{new Date(event.startDate).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}{event.location ? ` · ${event.location}` : ""}</p></div><Button onClick={() => handleRSVP(event.id, "going")} size="sm" className="w-full bg-green-600 hover:bg-green-700 sm:w-auto" disabled={rsvpEventMutation.isPending}>Going</Button></div>)}</div></Card>)}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents.map((event) => (
                <Card
                  key={event.id}
                  className="p-4 bg-slate-800 border-purple-500 hover:border-pink-500 transition-colors"
                >
                  <h3 className="text-lg font-bold text-white mb-2">{event.title}</h3>
                  <p className="text-purple-200 text-sm mb-2">{event.description}</p>
                  <div className="text-xs text-purple-300 mb-3">
                    <p>📅 {new Date(event.startDate).toLocaleDateString()}</p>
                    {event.location && <p>📍 {event.location}</p>}
                    <p>{event.isOnline ? "🌐 Online" : "📍 In-person"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleRSVP(event.id, "going")}
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={rsvpEventMutation.isPending}
                    >
                      Going
                    </Button>
                    <Button
                      onClick={() => handleRSVP(event.id, "interested")}
                      size="sm"
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      disabled={rsvpEventMutation.isPending}
                    >
                      Interested
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-white/10 bg-white/5 p-8 text-center"><p className="text-purple-200">No upcoming events yet.</p><p className="mt-2 text-sm text-slate-400">Create one for your community or check back soon for new gatherings.</p></Card>
          )}
        </div>
      </div>
    </div>
  );
}
