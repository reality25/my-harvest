import { Component, type ReactNode, type ErrorInfo } from "react";
import { log } from "@/services/systemLogger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  module?: string;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorMessage: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    log("error", this.props.module ?? "ErrorBoundary", error.message, {
      stack: error.stack?.slice(0, 500),
      componentStack: info.componentStack?.slice(0, 500),
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-2xl">
            ⚠️
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Something went wrong</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-xs">
              {this.state.errorMessage || "An unexpected error occurred. Please try again."}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
