# Deskwise — Project Walkthrough

**Length:** approximately 2 minutes 25 seconds.

**Suggested Loom title:** Deskwise | Full-stack AI Portfolio & Support Assistant Demo

**Suggested description:** A guided walkthrough of a responsive portfolio and its working support-assistant demo. Covers policy-grounded demo replies, source references, persistent support tickets, and a Python/Flask/SQLite implementation with optional OpenAI integration. Recorded in demo mode; no live AI request is shown.

## Uploading
Download [Deskwise-project-walkthrough.mp4](../videos/Deskwise-project-walkthrough.mp4), then upload it through Loom if video uploads are available on your plan. This file has not been published to Loom. The narration uses the AI-generated voice you selected.

## Chapters & transcript

### 00:00 — Portfolio overview

Hi, and welcome to our full-stack AI portfolio walkthrough. This project brings together a responsive portfolio website and Deskwise, a working support assistant demo. The goal is to show a complete user journey, from a polished interface to a backend API and persistent storage. The identity shown here is a placeholder, and the two additional project cards are clearly marked as design concepts.

### 00:28 — Support assistant

Let’s open the AI playground. Deskwise answers questions about a fictional store’s returns, shipping, account access, and billing. For this recording, we’re using the built-in demo mode. It retrieves sample policies and returns deterministic responses, without making a live model request. When we ask how to return an order, the assistant displays the relevant policy and a source reference. The conversation is saved through the Python backend.

### 00:55 — Knowledge & optional AI

Clicking the reference opens the knowledge base, so we can inspect the policy behind the response. This keeps the information visible instead of presenting an answer without context. The project also includes an optional OpenAI integration. With a valid API key configured securely on the server, the backend sends selected policy excerpts and recent conversation history to the model. That live integration is not being demonstrated in this recording.

### 01:23 — Support tickets

Some questions need a human next step. In the support tickets panel, we can create a ticket for a delayed delivery, then mark it resolved or reopen it. These are local demo tickets, not messages sent to an actual support team. Refreshing the page shows that the record persists. The database keeps each browser session’s conversations and tickets separate, while the interface gives users clear feedback about their actions.

### 01:50 — Implementation & next steps

Under the hood, the application uses HTML, CSS, and JavaScript on the frontend, Flask and Python for the API, and SQLite for storage. It includes input validation, CSRF checks, and parameterized database queries. Six backend tests passed, along with browser checks of the core workflow and mobile layout. This is a portfolio demonstration, not a production support platform. It provides a focused starting point for discussing your product requirements and building the next iteration. Thanks for watching.

## Captions
[Deskwise-captions.srt](../videos/Deskwise-captions.srt) is included as a separate file and as a selectable subtitle track in the MP4. Caption timing is approximate.
