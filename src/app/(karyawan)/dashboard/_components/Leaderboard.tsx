import React from "react";
import { cn } from "@/lib/utils";
import { Trophy, Medal, Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface LeaderboardProps {
  data: Array<{
    rank: number;
    name: string;
    department: string;
    score: number;
    isCurrentUser: boolean;
  }>;
}

const RANK_STYLE: Record<number, {
  badge: string;
  icon: React.ReactNode;
}> = {
  1: {
    badge: "bg-[#FEF3DC] text-[#C4861A] border-[#F5C05A]/40",
    icon: <Trophy size={14} className="text-[#E8A020]" />,
  },
  2: {
    badge: "bg-[#F1F5F9] text-[#64748B] border-[#CBD2E0]",
    icon: <Medal size={14} className="text-[#94A3B8]" />,
  },
  3: {
    badge: "bg-[#FEF3DC] text-[#92400E] border-[#FCD34D]/50",
    icon: <Medal size={14} className="text-[#C4861A]" />,
  },
};

export default function Leaderboard({ data }: LeaderboardProps) {
  const top5 = data.slice(0, 5);

  if (top5.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <div className="w-12 h-12 rounded-xl bg-[#F8F9FB] flex items-center justify-center">
          <Star size={22} className="text-[#CBD2E0]" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-[#475467] font-['DM_Sans']">
            Belum ada data peringkat
          </p>
          <p className="text-xs text-[#94A4B8] font-['DM_Sans'] mt-0.5">
            Selesaikan kursus untuk masuk peringkat
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {top5.map((item) => {
        const rs = RANK_STYLE[item.rank] || {
          badge: "bg-[#F8F9FB] text-[#475467] border-[#E4E7EC]",
          icon: null,
        };

        const initials = (item.name || "?")
          .split(" ")
          .slice(0, 2)
          .map((n) => n[0])
          .join("")
          .toUpperCase();

        return (
          <div
            key={item.rank}
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-xl border transition-all duration-150",
              item.isCurrentUser
                ? "bg-[#EFF8FF] border-[#B2DDFF]/60"
                : "bg-white border-[#F1F5F9] hover:border-[#E4E7EC] hover:bg-[#FAFBFF]"
            )}
          >
            {/* Rank badge */}
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 border",
                rs.badge
              )}
            >
              {item.rank <= 3 ? (
                rs.icon
              ) : (
                <span className="text-[11px] font-bold font-['DM_Sans'] text-[#64748B]">
                  {item.rank}
                </span>
              )}
            </div>

            {/* Avatar */}
            <Avatar className="h-8 w-8 shrink-0 ring-1 ring-[#E4E7EC]">
              <AvatarFallback className="bg-[#0F1C3F] text-white text-[11px] font-bold font-['Lexend_Deca']">
                {initials}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#0F1C3F] font-['DM_Sans'] leading-tight truncate">
                {item.name}
              </p>
              <p className="text-[11px] text-[#94A4B8] font-['DM_Sans'] truncate">
                {item.department}
              </p>
            </div>

            {/* Score */}
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-[#0F1C3F] font-['Lexend_Deca'] tabular-nums leading-tight">
                {item.score.toLocaleString()}
              </p>
              <p className="text-[10px] text-[#94A4B8] font-['DM_Sans']">
                poin
              </p>
            </div>
          </div>
        );
      })}

      <p className="text-center text-[11px] text-[#94A4B8] font-['DM_Sans'] pt-3 border-t border-[#F1F5F9] mt-2">
        {data.length} peserta dalam peringkat
      </p>
    </div>
  );
}
