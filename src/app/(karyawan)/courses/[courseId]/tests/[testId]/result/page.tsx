import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { 
  Trophy, 
  XCircle, 
  ArrowLeft, 
  RefreshCcw, 
  CheckCircle2, 
  ChevronRight,
  Clock,
  Target,
  BarChart3,
  CalendarDays,
  HelpCircle,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getTestAttemptDetail } from "@/actions/test";

export default async function TestResultPage({
  params,
  searchParams
}: {
  params: { courseId: string; testId: string };
  searchParams: { attemptId?: string };
}) {
  const session = await auth();
  if (!session || !session.user?.id) {
    return redirect("/");
  }

  if (!searchParams.attemptId) {
    return redirect(`/courses/${params.courseId}/tests/${params.testId}`);
  }

  const attempt = await getTestAttemptDetail(searchParams.attemptId);

  if (!attempt) {
    return redirect(`/courses/${params.courseId}`);
  }

  const isPassed = attempt.passed;
  const score = Math.round(attempt.score);
  const passingScore = attempt.test.passingScore;
  const testType = attempt.test.type; // PRE or POST

  // Get total attempts for this user/test
  const attemptCount = await db.testAttempt.count({
    where: { userId: session.user.id, testId: params.testId }
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-6 flex flex-col items-center">
      
      {/* Top Breadcrumb-like indicator */}
      <div className="max-w-4xl w-full mb-8 flex justify-between items-center text-slate-400">
         <Link href={`/courses/${params.courseId}`} className="flex items-center gap-2 hover:text-slate-900 transition-colors font-bold text-xs uppercase tracking-widest">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Kursus
         </Link>
         <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
            <Badge variant="outline" className={cn(
              "text-[10px] font-black uppercase tracking-tighter px-2 h-5 border-none",
              testType === "PRE" ? "bg-indigo-50 text-indigo-600" : "bg-amber-50 text-amber-600"
            )}>
              {testType} TEST
            </Badge>
            <span className="h-4 w-px bg-slate-100" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Percobaan #{attemptCount}</span>
         </div>
      </div>

      <div className="max-w-4xl w-full space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-1000">
        
        {/* Main Result Card */}
        <div className="relative group">
           {/* Glow Effect */}
           <div className={cn(
             "absolute -inset-1 rounded-[3.5rem] blur-2xl opacity-20 transition duration-1000 group-hover:opacity-30",
             isPassed ? "bg-emerald-500" : "bg-slate-900"
           )} />
           
           <Card className={cn(
             "rounded-[3rem] border-none shadow-2xl overflow-hidden relative",
             isPassed ? "bg-[#059669] text-white" : "bg-[#0F172A] text-white"
           )}>
              {/* Abstract decorative elements */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[80px] -mr-40 -mt-40 pointer-events-none" />
              <div className="absolute bottom-10 left-10 w-40 h-40 bg-white/5 rounded-full blur-[60px] pointer-events-none" />

              <CardContent className="p-10 md:p-16 text-center relative z-10">
                 <div className="flex flex-col items-center space-y-6">
                    <div className={cn(
                      "h-28 w-28 rounded-[2.5rem] flex items-center justify-center shadow-2xl transform rotate-3 transition-transform duration-700 group-hover:rotate-0",
                      isPassed ? "bg-white text-emerald-600" : "bg-rose-500 text-white"
                    )}>
                       {isPassed ? <Trophy className="h-14 w-14" /> : <XCircle className="h-14 w-14" />}
                    </div>
                    
                    <div className="space-y-2">
                       <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none">
                         {isPassed ? "Luar Biasa! Anda Lulus" : "Selesaikan Tantangan"}
                       </h1>
                       <p className={cn("text-lg md:text-xl font-medium opacity-80 max-w-xl mx-auto")}>
                         {isPassed 
                           ? "Keahlian Anda terbukti. Anda telah melampaui standar kompetensi yang ditetapkan." 
                           : "Sepertinya Anda butuh sedikit waktu lagi untuk meninjau materi kembali."}
                       </p>
                    </div>
                 </div>

                 {/* Score Visualization */}
                 <div className="mt-12 mb-12 flex flex-col md:flex-row items-center justify-center gap-10 md:gap-20">
                    <div className="relative">
                       <svg className="w-40 h-40 transform -rotate-90">
                          <circle
                             cx="80"
                             cy="80"
                             r="70"
                             stroke="currentColor"
                             strokeWidth="12"
                             fill="transparent"
                             className="opacity-10"
                          />
                          <circle
                             cx="80"
                             cy="80"
                             r="70"
                             stroke="currentColor"
                             strokeWidth="12"
                             fill="transparent"
                             strokeDasharray={440}
                             strokeDashoffset={440 - (440 * score) / 100}
                             strokeLinecap="round"
                             className="transition-all duration-1000 ease-out"
                          />
                       </svg>
                       <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-5xl font-black tracking-tighter">{score}%</span>
                          <span className="text-[10px] font-bold uppercase opacity-60">Skor Akhir</span>
                       </div>
                    </div>

                    <div className="h-px md:h-24 w-24 md:w-px bg-white/20" />

                    <div className="text-left space-y-4">
                       <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Batas Minimal Lulus</p>
                          <p className="text-3xl font-black">{passingScore}%</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Status Ujian</p>
                          <Badge className={cn(
                            "px-4 py-1 rounded-lg border-none text-xs font-black",
                            isPassed ? "bg-white/20 text-white" : "bg-rose-500/20 text-rose-300"
                          )}>
                             {isPassed ? "TERVERIFIKASI LULUS" : "BELUM LULUS"}
                          </Badge>
                       </div>
                    </div>
                 </div>

                 <div className="flex flex-col md:flex-row gap-4 justify-center">
                    <Button variant="secondary" className="h-16 px-12 rounded-[1.5rem] font-black text-slate-900 gap-3 group/btn transition-all hover:pr-14" asChild>
                       <Link href={`/courses/${params.courseId}`}>
                          <ArrowLeft className="h-5 w-5 transition-transform group-hover/btn:-translate-x-1" /> Dashboard Kursus
                       </Link>
                    </Button>
                    
                    {!isPassed && (
                      <Button className="h-16 px-12 rounded-[1.5rem] font-black bg-white text-slate-900 hover:bg-slate-100 gap-3 shadow-2xl shadow-black/40 group/btn transition-all" asChild>
                         <Link href={`/courses/${params.courseId}/tests/${params.testId}`}>
                            <RefreshCcw className="h-5 w-5 transition-transform group-hover/btn:rotate-180 duration-500" /> Mulai Ulang Ujian
                         </Link>
                      </Button>
                    )}
                    
                    {isPassed && testType === "POST" && (
                      <Button className="h-16 px-12 rounded-[1.5rem] font-black bg-emerald-400 text-[#065F46] hover:bg-emerald-300 gap-3 shadow-2xl shadow-emerald-900/40 group/btn transition-all" asChild>
                         <Link href={`/courses/${params.courseId}`}>
                            Ke Halaman Kursus <ChevronRight className="h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
                         </Link>
                      </Button>
                    )}
                 </div>
              </CardContent>
           </Card>
        </div>

        {/* Breakdown Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[
             { label: "Waktu Pengerjaan", value: attempt.completedAt ? new Date(attempt.completedAt).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }) : "-", icon: Clock, color: "text-indigo-500", bg: "bg-indigo-50" },
             { label: "Tanggal Ujian", value: attempt.createdAt ? new Date(attempt.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' }) : "-", icon: CalendarDays, color: "text-amber-500", bg: "bg-amber-50" },
             { label: "Jawaban Benar", value: `${attempt.answers.filter((a: any) => a.isCorrect).length} / ${attempt.test.questions.length}`, icon: Target, color: "text-emerald-500", bg: "bg-emerald-50" },
           ].map((stat, i) => (
             <Card key={i} className="rounded-[2rem] border-none shadow-xl bg-white p-8 group hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center gap-5">
                   <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors", stat.bg, stat.color)}>
                      <stat.icon className="h-6 w-6" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{stat.label}</p>
                      <p className="text-2xl font-black text-slate-800 leading-none">{stat.value}</p>
                   </div>
                </div>
             </Card>
           ))}
        </div>

        {/* Insight Card (Contextual) */}
        <Card className="rounded-[2.5rem] border-slate-100 shadow-sm bg-white overflow-hidden p-8 md:p-10">
           <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                 {isPassed ? <BarChart3 className="h-10 w-10" /> : <HelpCircle className="h-10 w-10" />}
              </div>
              <div className="flex-1 space-y-2 text-center md:text-left">
                 <h3 className="text-xl font-black text-slate-800 tracking-tight">
                    {isPassed ? "Analisis Performa Anda" : "Butuh Bimbingan Materi?"}
                 </h3>
                 <p className="text-slate-500 text-sm leading-relaxed font-medium">
                    {isPassed 
                       ? "Selamat! Anda memiliki pemahaman yang sangat baik terhadap modul ini. Nilai Anda berada di atas rata-rata peserta lain. Tetap pertahankan ritme belajar ini untuk kursus selanjutnya."
                       : "Jangan berkecil hati. Kegagalan adalah bagian dari proses belajar. Kami merekomendasikan Anda untuk membuka kembali materi yang belum dikuasai sebelum mencoba kembali."}
                 </p>
              </div>
              <div className="shrink-0 w-full md:w-auto">
                 <Button variant="outline" className="w-full md:w-auto h-12 rounded-xl font-bold border-2 border-slate-100 px-6" asChild>
                    <a href="#review">Lihat Detail Jawaban</a>
                 </Button>
              </div>
           </div>
        </Card>

        {/* Answer Review Section */}
        <section id="review" className="space-y-8 pt-6">
           <div className="flex items-center justify-between">
              <div>
                 <h2 className="text-2xl font-black text-slate-800 tracking-tight">Review Jawaban</h2>
                 <p className="text-sm text-slate-400 font-medium">Evaluasi hasil pengerjaan Anda per soal</p>
              </div>
              <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-black px-4 py-1.5 rounded-xl border-none">
                 {attempt.test.questions.length} TOTAL SOAL
              </Badge>
           </div>

           <div className="space-y-6">
              {attempt.test.questions.map((question: any, idx: number) => {
                 const userAnswer = attempt.answers.find((a: any) => a.questionId === question.id);
                 const correctOption = question.options.find((o: any) => o.isCorrect);
                 const isCorrect = userAnswer?.isCorrect;

                 return (
                    <Card key={question.id} className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden group transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200">
                       <CardContent className="p-8 space-y-8">
                          {/* Question Header */}
                          <div className="flex items-start gap-5">
                             <div className={cn(
                                "h-12 w-12 rounded-2xl flex items-center justify-center font-black shrink-0 transition-transform group-hover:scale-110",
                                isCorrect ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                             )}>
                                {idx + 1}
                             </div>
                             <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pertanyaan</p>
                                   {isCorrect ? (
                                      <Badge className="bg-emerald-500 text-[9px] font-black h-4 px-1.5 uppercase border-none">Benar</Badge>
                                   ) : (
                                      <Badge className="bg-rose-500 text-[9px] font-black h-4 px-1.5 uppercase border-none">Salah</Badge>
                                   )}
                                </div>
                                <h4 className="text-lg md:text-xl font-black text-slate-800 leading-tight">
                                   {question.text}
                                </h4>
                             </div>
                          </div>

                          {/* Options Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-0 md:pl-16">
                             {question.options.map((option: any, optIdx: number) => {
                                const char = String.fromCharCode(65 + optIdx);
                                const isUserSelected = userAnswer?.selectedOptionId === option.id;
                                const isOptionCorrect = option.isCorrect;

                                return (
                                   <div 
                                      key={option.id}
                                      className={cn(
                                         "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300",
                                         isUserSelected && isCorrect && "bg-emerald-50 border-emerald-500/20 text-emerald-900 shadow-sm",
                                         isUserSelected && !isCorrect && "bg-rose-50 border-rose-500/20 text-rose-900",
                                         !isUserSelected && isOptionCorrect && "border-emerald-500/50 bg-emerald-50/30",
                                         !isUserSelected && !isOptionCorrect && "bg-slate-50 border-transparent text-slate-500 opacity-60"
                                      )}
                                   >
                                      <div className={cn(
                                         "h-8 w-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0",
                                         isUserSelected ? (isCorrect ? "bg-emerald-500 text-white" : "bg-rose-500 text-white") : (isOptionCorrect ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-400")
                                      )}>
                                         {char}
                                      </div>
                                      <span className="font-bold text-sm flex-1">{option.text}</span>
                                      
                                      {isUserSelected && (
                                         isCorrect ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-rose-500" />
                                      )}
                                      {!isUserSelected && isOptionCorrect && (
                                         <Badge variant="outline" className="text-[8px] font-black uppercase text-emerald-600 border-emerald-200 bg-white">Jawaban Benar</Badge>
                                      )}
                                   </div>
                                );
                             })}
                          </div>
                       </CardContent>
                    </Card>
                 );
              })}
           </div>
        </section>

      </div>
      

    </div>
  );
}
