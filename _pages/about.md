---
layout: about
title: about
permalink: /
# subtitle: <a href='#'>Affiliations</a>. Address. Contacts. Motto. Etc.

profile:
  align: right
  image: prof_pic.png
  image_circular: false # crops the image to make it circular
  # more_info: >
  #   <p>555 your office number</p>
  #   <p>123 your address street</p>
  #   <p>Your City, State 12345</p>

selected_papers: true # includes a list of papers marked as "selected={true}"
social: true # includes social icons at the bottom of the page

announcements:
  enabled: false # includes a list of news items
  scrollable: true # adds a vertical scroll bar if there are more than 3 news items
  limit: 5 # leave blank to include all the news in the `_news` folder

latest_posts:
  enabled: false
  scrollable: true # adds a vertical scroll bar if there are more than 3 new posts items
  limit: # leave blank to include all the blog posts
---

I am a Software Engineer @ Microsoft. I work in Information Retrieval — building question-answering systems — with a growing pull toward database internals and agentic memory. A competitive programmer at heart, I carry that algorithmic intuition into the systems that make search and databases fast. I write about what I learn.

On the side, the competitive itch never fully left: top 2% WW in [LeetCode contests](https://leetcode.com/u/triplethread/) and top 2% WW in [Chess.com puzzles](https://www.chess.com/member/3thread/stats/puzzles).

### Previous

**@ Center for Materials Data Science**, I was a Researcher advised by [Yinghui Wu](https://yinghwu.github.io), working on query suggestions and search infrastructure for AI in scientific discovery ([ISWC 2025](https://arxiv.org/pdf/2507.14032)).

**@ Microsoft AI**, I interned on the Security team on the data layer behind agentic incident understanding.

- Built a tiered archiving pipeline over monthly agent logs, selectively promoting critical signals to hot storage to meet retention mandates at lower storage cost.
- Designed an agentic Copilot workflow for sensitive-data detection across private documents, batching LLM calls with checkpointing to survive partial failures and resume without reprocessing completed batches.

_Technologies: C#, Python, Azure Blob Storage, Azure OpenAI, Microsoft Graph API, KQL._

**@ AWS**, I interned on the Alexa Voice Shopping team on the recommendation serving pipeline.

- Built a serverless ranking inference service on AWS Lambda and Step Functions, coordinating multi-stage stateful workflows for Alexa voice shopping recommendation.
- Hardened the pipeline against transient downstream failures with exponential backoff and dead-letter queue replay.

_Technologies: Python, AWS Lambda, Step Functions, SQS, DynamoDB, CloudWatch._
