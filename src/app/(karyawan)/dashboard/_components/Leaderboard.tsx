import React from "react";
import { cn } from "@/lib/utils";
import { Trophy, Medal, Star, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LeaderboardProps {
  data: {
    rank: number;
    name: string;
    department: string;
    score: number;
    isCurrentUser: boolean;
  }[];
}

export default function Leaderboard({ data }: LeaderboardProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-5 w-5 text-amber-500" />;
      case 2: return <Medal className="h-5 w-5 text-slate-400" />;
      case 3: return <Medal className="h-5 w-5 text-amber-700" />;
      default: return null;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1: return "bg-amber-100 text-amber-700 border-amber-200";
      case 2: return "bg-slate-100 text-slate-700 border-slate-200";
      case 3: return "bg-orange-100 text-orange-700 border-orange-200";
      default: return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  const topUsers = data.slice(0, 5);

  return (
    <Card className="bg-white shadow-sm border-slate-200 h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-slate-900">
              Papan Peringkat
            </CardTitle>
            <CardDescription className="text-sm text-slate-600">
              Top performer bulan ini
            </CardDescription>
          </div>
          
          {data.length > 0 && (
            <div className="flex items-center gap-2 text-sm shrink-0">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-slate-700">
                {data.length} peserta
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col pt-0 pb-4">
        {topUsers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
            <div className="p-4 bg-slate-100 rounded-full">
              <Star className="h-8 w-8 text-slate-300" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">
                Belum Ada Peringkat
              </p>
              <p className="text-xs text-slate-600">
                Selesaikan kursus untuk masuk peringkat
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-2">
              {topUsers.map((user) => (
                <div
                  key={user.rank}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-all duration-200 border",
                    user.isCurrentUser 
                      ? "bg-blue-50 border-blue-200 shadow-sm" 
                      : "bg-white border-slate-100 hover:bg-slate-50"
                  )}
                >
                  {/* Rank Badge */}
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm border shrink-0",
                    getRankBadgeColor(user.rank)
                  )}>
                    {user.rank}
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-sm text-slate-900 truncate">
                        {user.name}
                      </p>
                      {user.isCurrentUser && (
                        <Badge className="bg-blue-600 text-white text-xs font-medium border-0 px-1.5 py-0">
                          Anda
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 truncate">
                      {user.department}
                    </p>
                  </div>
                  
                  {/* Score */}
                  <div className="text-right shrink-0">
                    <div className="text-base font-bold text-slate-900">
                      {user.score.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-600">
                      poin
                    </div>
                  </div>
                  
                  {/* Rank Icon */}
                  {getRankIcon(user.rank) && (
                    <div className="shrink-0">
                      {getRankIcon(user.rank)}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Footer */}
            <div className="pt-3 mt-3 border-t border-slate-200">
              <p className="text-xs text-center text-slate-500">
                Menampilkan top 5 dari {data.length} peserta
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
