"use client";

import React from "react";
import { Badge, Card, Nav, Footer, Avatar, Button, ContactForm } from "../primitives";

const posts = [
  {
    title: "Introducing Our New Design System",
    excerpt:
      "We've rebuilt our design system from the ground up with a focus on consistency, accessibility, and developer experience.",
    category: "Product",
    date: "Apr 5, 2025",
    readTime: "5 min read",
    author: "Sarah Chen",
    authorInitials: "SC",
    featured: true,
  },
  {
    title: "Building for Scale: Lessons Learned",
    excerpt:
      "How we scaled our infrastructure to handle 10x traffic growth while maintaining sub-100ms response times.",
    category: "Engineering",
    date: "Apr 2, 2025",
    readTime: "8 min read",
    author: "James Wilson",
    authorInitials: "JW",
    featured: false,
  },
  {
    title: "The Future of AI-Powered Development",
    excerpt:
      "Exploring how artificial intelligence is transforming the way we write, review, and deploy code.",
    category: "AI",
    date: "Mar 28, 2025",
    readTime: "6 min read",
    author: "Maria Lopez",
    authorInitials: "ML",
    featured: false,
  },
  {
    title: "A Guide to Modern Authentication",
    excerpt:
      "Best practices for implementing secure, user-friendly authentication in your applications.",
    category: "Security",
    date: "Mar 20, 2025",
    readTime: "10 min read",
    author: "Alex Kumar",
    authorInitials: "AK",
    featured: false,
  },
];

export function BlogPreview() {
  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <div className="flex flex-col min-h-[800px]">
      <Nav />

      <section className="px-8 py-12">
        <h1
          className="text-3xl font-bold mb-2"
          style={{
            color: "var(--d-text-primary)",
            fontFamily: "var(--d-font-heading)",
          }}
        >
          Blog
        </h1>
        <p className="text-base" style={{ color: "var(--d-text-secondary)" }}>
          Insights, updates, and stories from our team.
        </p>
      </section>

      {/* Featured Post */}
      <section className="px-8 pb-8">
        <Card className="p-8 flex gap-8" hover>
          <div
            className="w-80 h-48 shrink-0"
            style={{
              backgroundColor: "color-mix(in srgb, var(--d-primary) 10%, var(--d-surface))",
              borderRadius: "var(--d-radius-md)",
            }}
          />
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <Badge>{featured.category}</Badge>
              <span className="text-xs" style={{ color: "var(--d-text-muted)" }}>
                {featured.date} · {featured.readTime}
              </span>
            </div>
            <h2
              className="text-xl font-bold mb-2"
              style={{
                color: "var(--d-text-primary)",
                fontFamily: "var(--d-font-heading)",
              }}
            >
              {featured.title}
            </h2>
            <p
              className="text-sm mb-4 leading-relaxed"
              style={{ color: "var(--d-text-secondary)" }}
            >
              {featured.excerpt}
            </p>
            <div className="flex items-center gap-2">
              <Avatar name={featured.authorInitials} size={28} />
              <span className="text-sm" style={{ color: "var(--d-text-secondary)" }}>
                {featured.author}
              </span>
            </div>
          </div>
        </Card>
      </section>

      {/* Post Grid */}
      <section className="px-8 pb-16">
        <div className="grid grid-cols-3 gap-6">
          {rest.map((post) => (
            <Card key={post.title} className="flex flex-col" hover>
              <div
                className="h-36 w-full"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--d-primary) 8%, var(--d-surface))",
                  borderRadius: "var(--d-radius-lg) var(--d-radius-lg) 0 0",
                }}
              />
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge>{post.category}</Badge>
                  <span className="text-xs" style={{ color: "var(--d-text-muted)" }}>
                    {post.readTime}
                  </span>
                </div>
                <h3
                  className="text-base font-semibold mb-2"
                  style={{ color: "var(--d-text-primary)" }}
                >
                  {post.title}
                </h3>
                <p
                  className="text-sm flex-1 mb-4"
                  style={{ color: "var(--d-text-secondary)" }}
                >
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar name={post.authorInitials} size={24} />
                    <span
                      className="text-xs"
                      style={{ color: "var(--d-text-muted)" }}
                    >
                      {post.author} · {post.date}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section
        className="px-8 py-12 text-center"
        style={{ backgroundColor: "var(--d-surface)" }}
      >
        <h2
          className="text-xl font-bold mb-2"
          style={{
            color: "var(--d-text-primary)",
            fontFamily: "var(--d-font-heading)",
          }}
        >
          Subscribe to our newsletter
        </h2>
        <p className="text-sm mb-4" style={{ color: "var(--d-text-muted)" }}>
          Get the latest articles delivered straight to your inbox.
        </p>
        <div className="flex gap-2 justify-center max-w-sm mx-auto">
          <input
            placeholder="your@email.com"
            className="flex-1 px-3 py-2 text-sm outline-none"
            style={{
              backgroundColor: "var(--d-bg)",
              color: "var(--d-text-primary)",
              border: "1px solid var(--d-border)",
              borderRadius: "var(--d-radius-md)",
            }}
          />
          <Button size="md">Subscribe</Button>
        </div>
      </section>

      {/* Contact */}
      <section className="px-8 py-12 max-w-lg mx-auto">
        <ContactForm />
      </section>

      <Footer />
    </div>
  );
}
