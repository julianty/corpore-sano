import React, { ReactNode } from "react";
import { Container, Stack, Title, Alert, Button } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches errors in child components and displays a fallback UI
 * Provides users with feedback and recovery options
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(_error: Error): Pick<ErrorBoundaryState, "hasError"> {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging
    console.error("Error caught by boundary:", _error, errorInfo);

    this.setState({
      error: _error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container size="md" py="xl">
          <Stack gap="lg">
            <Alert
              icon={<IconAlertTriangle size={16} />}
              title="Something went wrong"
              color="red"
              variant="light"
            >
              We encountered an unexpected error. Please try again or contact support if the problem persists.
            </Alert>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <Stack gap="sm">
                <div>
                  <Title order={4} mb="xs">
                    Error Details (Development Only)
                  </Title>
                  <pre
                    style={{
                      backgroundColor: "#f5f5f5",
                      padding: "12px",
                      borderRadius: "6px",
                      overflow: "auto",
                      fontSize: "12px",
                    }}
                  >
                    {this.state.error.toString()}
                    {"\n"}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              </Stack>
            )}

            <Stack gap="sm">
              <Button
                onClick={this.handleReset}
                variant="filled"
                aria-label="Try again"
              >
                Try Again
              </Button>
              <Button
                onClick={() => window.location.href = "/"}
                variant="default"
                aria-label="Go to home page"
              >
                Go to Home
              </Button>
            </Stack>
          </Stack>
        </Container>
      );
    }

    return this.props.children;
  }
}
