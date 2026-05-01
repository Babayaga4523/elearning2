"use client";

import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: string;
}

/**
 * Error Boundary for Admin Panel
 * Catches runtime errors and displays a user-friendly error page
 */
export class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error,
      errorInfo: error.stack 
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log error to console for debugging
    console.error("Admin Error Boundary caught an error:", error, errorInfo);
    
    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            {/* Error Card */}
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-rose-500 to-rose-600 p-8 text-white">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <AlertTriangle className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black tracking-tight">
                      Terjadi Kesalahan
                    </h1>
                    <p className="text-rose-100 text-sm font-medium mt-1">
                      Admin panel mengalami error yang tidak terduga
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 space-y-6">
                {/* Error Message */}
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                  <p className="text-sm font-bold text-rose-900 mb-2">
                    Error Message:
                  </p>
                  <p className="text-sm text-rose-700 font-mono">
                    {this.state.error?.message || "Unknown error occurred"}
                  </p>
                </div>

                {/* Error Stack (Collapsible) */}
                {this.state.errorInfo && (
                  <details className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <summary className="text-sm font-bold text-slate-700 cursor-pointer hover:text-slate-900">
                      Technical Details (untuk developer)
                    </summary>
                    <pre className="mt-3 text-xs text-slate-600 font-mono overflow-x-auto whitespace-pre-wrap">
                      {this.state.errorInfo}
                    </pre>
                  </details>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    onClick={this.handleReset}
                    className="flex-1 flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-gradient-to-r from-[#0F1C3F] to-[#1A3060] text-white font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Muat Ulang Halaman
                  </button>
                  
                  <Link 
                    href="/admin" 
                    className="flex-1 flex items-center justify-center gap-2 h-12 px-6 rounded-xl border-2 border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all"
                  >
                    <Home className="h-4 w-4" />
                    Kembali ke Dashboard
                  </Link>
                </div>

                {/* Help Text */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-xs text-amber-800 font-medium">
                    <strong>💡 Tips:</strong> Jika error terus terjadi, coba:
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-amber-700 ml-4 list-disc">
                    <li>Clear browser cache dan cookies</li>
                    <li>Logout dan login kembali</li>
                    <li>Gunakan browser yang berbeda</li>
                    <li>Hubungi tim IT jika masalah berlanjut</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-6">
              <p className="text-xs text-slate-500 font-medium">
                BNI Finance E-Learning Admin Panel • Error ID: {Date.now()}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
