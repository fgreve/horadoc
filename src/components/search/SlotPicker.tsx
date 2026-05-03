"use client";

import { formatChileDate, formatChileTime } from "@/lib/utils/dates";

interface Slot {
  id: string;
  date: string;
  start_time: string;
  end_time?: string;
  is_telemedicine: boolean;
  sede?: string;
}

interface SlotPickerProps {
  slots: Slot[];
  bookingUrl: string;
}

export function SlotPicker({ slots, bookingUrl }: SlotPickerProps) {
  const grouped = slots.reduce(
    (acc, slot) => {
      const date = slot.date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(slot);
      return acc;
    },
    {} as Record<string, Slot[]>
  );

  const sortedDates = Object.keys(grouped).sort();

  if (!slots.length) {
    return (
      <div className="text-center py-8 text-neutral-500">
        <p>No hay horas disponibles en este momento.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedDates.map((date) => (
        <div key={date}>
          <h4 className="text-sm font-semibold text-neutral-700 mb-2">
            {formatChileDate(date)}
          </h4>
          <div className="flex flex-wrap gap-2">
            {grouped[date]
              .sort((a, b) => a.start_time.localeCompare(b.start_time))
              .map((slot) => (
                <a
                  key={slot.id}
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 transition-colors"
                >
                  {formatChileTime(slot.start_time)}
                  {slot.is_telemedicine && (
                    <span className="text-xs text-primary-500">TM</span>
                  )}
                </a>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
