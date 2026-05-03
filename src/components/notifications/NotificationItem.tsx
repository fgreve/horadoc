import { Bell, CheckCircle2, XCircle } from "lucide-react";
import { formatChileDate, formatChileTime } from "@/lib/utils/dates";
import { ClinicLogo } from "@/components/shared/ClinicLogo";

interface NotificationItemProps {
  notification: {
    id: string;
    channel: string;
    delivered: boolean;
    sent_at: string;
    payload: {
      doctorName: string;
      clinicName: string;
      date: string;
      time: string;
      sede?: string;
      bookingUrl: string;
    };
  };
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const { payload, delivered, sent_at } = notification;

  return (
    <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-neutral-200">
      <div className="flex-shrink-0 mt-0.5">
        <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center">
          <Bell className="h-4 w-4 text-primary-600" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-neutral-900 truncate">
            {payload.doctorName}
          </p>
          {delivered ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-success flex-shrink-0" />
          ) : (
            <XCircle className="h-3.5 w-3.5 text-error flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-neutral-500 mt-0.5">
          {payload.clinicName} {payload.sede && `- ${payload.sede}`}
        </p>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-600">
          <span>{formatChileDate(payload.date)}</span>
          <span>{formatChileTime(payload.time)}</span>
        </div>
        <a
          href={payload.bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
        >
          Reservar hora
        </a>
      </div>

      <div className="flex-shrink-0 text-xs text-neutral-400">
        {new Date(sent_at).toLocaleDateString("es-CL", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
    </div>
  );
}
