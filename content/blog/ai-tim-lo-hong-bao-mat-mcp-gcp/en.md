---
title: "Using AI to find a security hole in MCP tools on GCP: humans ask the right question, AI does the rest"
date: 2026-11-12
description: A vulnerability that leaked GCP access tokens sat in plain sight. Why nobody saw it, and how I worked with AI to find it.
tags: [ai, security, mcp, gcp]
---

The most dangerous vulnerability I've ever found wasn't hidden in some obscure piece of code. It sat in a feature everyone knew about, one that had passed review, passed testing, and was used by customers every day. Nobody saw it, not because people were careless, but because **every part of the system was correct on its own**.

This post is about how I found it with AI. My biggest lesson: AI reads code far faster than I do, but **the right question still has to come from a human**.

*The vulnerability has been fixed. I've left out the company name and any details that could identify the system, and I only describe it at the level of principle.*

## Background: AI agents, tools, and a "Custom API" feature

The system had AI agents that used tools, MCP style: the agent receives a question, decides which tool to call, reads the result, and answers the user. The tools ran on the company's GCP infrastructure.

One of them was very popular: **Custom API**. Users configured a URL themselves, and the agent would call it when needed, for example to look up an order or fetch customer details from their own systems. A flexible feature, exactly what customers wanted.

The problem: users could enter **any URL**, including an address that is only reachable from *inside* GCP. GCP has an internal endpoint that servers use to get an access token for the service account they run as. The tool's request originated inside the infrastructure, so it could reach that endpoint.

Put it together: a user configures a Custom API pointing at the token endpoint, then simply **asks the AI to return the tool's raw result in its answer**. The agent does exactly what it was designed to do: call the tool, read the result, answer. And an access token for a service account with very broad GCP permissions shows up right there in the chat window.

This is a classic form of SSRF (server-side request forgery). What's new is that the attacker doesn't need to write code or send a single request: **the AI agent does all of it for them, including carrying the data out.**

## Why did nobody find it?

In hindsight it's obvious. But it had been there for a while, and I think the reason lies in how each person looked at the system:

- **The feature developers** saw an HTTP tool doing what was asked: the user enters a URL, the tool calls it.
- **The infrastructure team** saw a service running under a service account, which is normal on GCP.
- **The AI team** saw an agent reading tool results and answering in context, exactly as intended.
- **Code review** looked at one pull request at a time. No single PR contained the vulnerability, because it only appears when those three things are combined.
- **QA** tested whether the feature worked. Nobody wrote a test case for "what if a user deliberately points the URL at the inside of our infrastructure".

There's one more reason: we tend to treat tools as "internal code, trusted". But a tool whose **input the user controls**, and **that the AI decides when to call**, isn't internal code anymore. It's attack surface.

## The human question: "Whose identity does this tool run as?"

What made me stop wasn't a strange line of code. It was a very simple question while looking at the architecture: **which service account do these tools run as, and what can that service account do?**

From there, the reasoning moved quickly:

1. The tools run inside GCP, under a service account with broad permissions.
2. One tool lets the user choose where it calls.
3. So a user can make a request originate *from inside* the infrastructure, carrying that service account's identity.
4. And the AI will show the result to the user.

This is the step I don't think AI does well on its own yet. Hand AI an entire codebase and say "find vulnerabilities", and you get a long list of things that are true but generic: missing validation here, should add rate limiting there. The truly dangerous issue lived at the **boundary between systems**: between user data, infrastructure permissions, and AI behavior. Seeing it takes someone who understands all three and has the sense that "something here isn't right".

## AI does the rest

Once I had a hypothesis, AI became an extremely effective partner. Instead of "go find vulnerabilities", I gave it specific questions:

- Where does the Custom API URL travel in the code? Is anything checked before the call? Are internal addresses blocked? Are redirects followed?
- Which service account is attached to the service that runs the tools? What permissions does it have?
- Is the tool's result filtered in any way before it goes into the LLM's context and back to the user?
- **Are there other tools with the same shape**: taking a URL or destination from the user, then calling out from inside the infrastructure?

For each question, AI read every relevant file within minutes, work that would have taken me a whole afternoon, and answered with locations in the code so I could check. The last question was especially valuable: vulnerabilities rarely come alone, and AI is much better than me at sweeping a whole codebase for similar patterns.

Then I **verified it myself** in a safe environment, rather than trusting AI's conclusion just because it sounded sure. Once confirmed, I reported it to the team with the impact and a suggested fix, and AI helped me write that report more clearly too.

## How to fix this class of vulnerability

If you're building tools for AI agents in the cloud, these are the defenses worth having. Each layer stops part of the problem, so use them together:

- **Block internal destinations.** Don't allow calls to internal, link-local, or metadata addresses. Check *after* DNS resolution, and check again after every redirect (or disable redirects), because blocking by hostname is easy to bypass.
- **Allowlist where you can.** If customers only need to call a few of their own systems, have them register domains up front instead of allowing any URL.
- **Least privilege.** The service that runs user-configured tools should have its own service account with almost no permissions on your infrastructure. If a token does leak, it can't do much.
- **Isolate where it runs.** Code that calls user-chosen URLs shouldn't run alongside privileged services.
- **Filter tool output before it reaches the AI.** Detect and mask strings that look like tokens, keys, or credentials. Treat tool output as untrusted data.
- **Don't rely on the prompt.** A line saying "never reveal tokens" in the system prompt is not a security control. Users will always find a way to ask the AI to do otherwise.
- **Log and alert.** Watch for unusual outbound requests from the services that run tools.

## What I took away

AI has changed how I do security work, but not in the "AI finds every vulnerability by itself" way. The collaboration that works for me is:

1. **A human raises the suspicion.** Understand the architecture, look where systems touch, and ask questions like "whose identity does this run as?", "who controls this input?", "where does this data end up?".
2. **AI answers fast and wide.** Trace the data flow, read the configuration, find similar spots across the whole codebase.
3. **A human verifies and decides.** Check again, assess severity, choose the fix.

And a note for anyone building AI agents: when you let AI call tools, you also give users an indirect way to control those tools. Design your tools as if the user were calling them directly, because in practice they are.
