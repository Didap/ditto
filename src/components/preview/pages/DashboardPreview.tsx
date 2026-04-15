"use client";

import React from "react";
import {
  Button,
  Badge,
  Sidebar,
  Tabs,
  Table,
  StatCard,
  Avatar,
  Input,
  BarChart,
  LineChart,
} from "../primitives";

export function DashboardPreview() {
  return (
    <div className="flex min-h-[800px]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-6 py-3"
          style={{ borderBottom: "1px solid var(--d-border)" }}
        >
          <div className="flex items-center gap-3">
            <h1
              className="text-lg font-bold"
              style={{
                color: "var(--d-text-primary)",
                fontFamily: "var(--d-font-heading)",
              }}
            >
              Dashboard
            </h1>
            <Badge variant="success">Live</Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-52">
              <Input placeholder="Search..." />
            </div>
            <Avatar name="JD" />
          </div>
        </div>

        <div className="p-6 flex-1">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Total Revenue"
              value="$45,231"
              change="+12.5%"
              positive={true}
            />
            <StatCard
              label="Subscriptions"
              value="2,350"
              change="+8.2%"
              positive={true}
            />
            <StatCard
              label="Active Users"
              value="12,234"
              change="+3.1%"
              positive={true}
            />
            <StatCard
              label="Churn Rate"
              value="2.4%"
              change="-0.5%"
              positive={false}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div
              className="p-4"
              style={{
                backgroundColor: "var(--d-surface)",
                border: "1px solid var(--d-border)",
                borderRadius: "var(--d-radius-lg)",
              }}
            >
              <BarChart title="Monthly Revenue" />
            </div>
            <div
              className="p-4"
              style={{
                backgroundColor: "var(--d-surface)",
                border: "1px solid var(--d-border)",
                borderRadius: "var(--d-radius-lg)",
              }}
            >
              <LineChart title="Weekly Trend" />
            </div>
          </div>

          {/* Tabs + Table */}
          <Tabs items={["Overview", "Analytics", "Reports", "Exports"]} active={0} />

          <div className="mt-4 flex items-center justify-between mb-4">
            <h2
              className="text-base font-semibold"
              style={{ color: "var(--d-text-primary)" }}
            >
              Recent Transactions
            </h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm">
                Filter
              </Button>
              <Button size="sm">Export</Button>
            </div>
          </div>

          <Table
            headers={["Customer", "Status", "Amount", "Date"]}
            rows={[
              ["Olivia Martin", "Completed", "+$1,999.00", "Apr 5, 2025"],
              ["Jackson Lee", "Processing", "+$39.00", "Apr 5, 2025"],
              ["Isabella Nguyen", "Completed", "+$299.00", "Apr 4, 2025"],
              ["William Kim", "Failed", "-$99.00", "Apr 4, 2025"],
              ["Sofia Davis", "Completed", "+$499.00", "Apr 3, 2025"],
            ]}
          />
        </div>
      </div>
    </div>
  );
}
