# Distributed Systems Visual Lab

## Goal
Build an interactive simulation platform that helps users understand distributed systems, algorithms, and mathematical performance behavior through visualization.

## First module
Kafka-like event streaming simulator

## Features for v1
- Producers send messages at configurable rates
- Messages are assigned to partitions
- Consumers in a consumer group process partition messages
- Lag builds if consumer throughput is lower than producer throughput
- Retries and dead letter queue behavior can be simulated
- Real-time metrics update continuously
- User can pause, resume, reset, and step through simulation

## UI areas
- Left sidebar: controls
- Center: system visualization
- Right sidebar: metrics and event log
- Bottom: throughput and lag charts

## Technical constraints
- Frontend-only for v1
- TypeScript only
- Use React with clean component boundaries
- Use Zustand for simulation state
- Keep simulation logic separate from UI rendering
- Components should be reusable for future modules

## Architecture principles
- Simulation engine should be deterministic
- State updates should be testable
- UI must subscribe to derived state, not own business logic
- Separate domain models from rendering models