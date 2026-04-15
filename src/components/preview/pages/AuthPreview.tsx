"use client";

import React from "react";
import { Button, Card, Input } from "../primitives";

export function AuthPreview() {
  return (
    <div
      className="flex items-center justify-center min-h-[800px] px-4"
      style={{ backgroundColor: "var(--d-bg)" }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div
            className="text-3xl font-bold mb-2"
            style={{
              color: "var(--d-text-primary)",
              fontFamily: "var(--d-font-heading)",
            }}
          >
            Welcome back
          </div>
          <p className="text-sm" style={{ color: "var(--d-text-muted)" }}>
            Sign in to your account to continue
          </p>
        </div>

        <Card className="p-6">
          <div className="flex flex-col gap-4">
            {/* Social Login */}
            <div className="flex gap-3">
              <button
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: "var(--d-bg)",
                  color: "var(--d-text-primary)",
                  border: "1px solid var(--d-border)",
                  borderRadius: "var(--d-radius-md)",
                }}
              >
                <span>G</span> Google
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: "var(--d-bg)",
                  color: "var(--d-text-primary)",
                  border: "1px solid var(--d-border)",
                  borderRadius: "var(--d-radius-md)",
                }}
              >
                <span>⬡</span> GitHub
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ backgroundColor: "var(--d-border)" }} />
              <span className="text-xs" style={{ color: "var(--d-text-muted)" }}>
                OR CONTINUE WITH
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: "var(--d-border)" }} />
            </div>

            {/* Form */}
            <Input label="Email" placeholder="name@example.com" type="email" />
            <Input label="Password" placeholder="Enter your password" type="password" />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm" style={{ color: "var(--d-text-secondary)" }}>
                <input
                  type="checkbox"
                  className="rounded"
                  style={{ accentColor: "var(--d-primary)" }}
                />
                Remember me
              </label>
              <span className="text-sm cursor-pointer" style={{ color: "var(--d-primary)" }}>
                Forgot password?
              </span>
            </div>

            <Button size="lg">Sign In</Button>

            <p className="text-center text-sm" style={{ color: "var(--d-text-muted)" }}>
              Don&apos;t have an account?{" "}
              <span className="cursor-pointer font-medium" style={{ color: "var(--d-primary)" }}>
                Sign up
              </span>
            </p>
          </div>
        </Card>

        <p className="text-center text-xs mt-4" style={{ color: "var(--d-text-muted)" }}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
