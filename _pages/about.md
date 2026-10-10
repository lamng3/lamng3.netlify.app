---
layout: default
title: Lam Nguyen
permalink: /
description: >-
  Lam Nguyen, researcher. AI for scientific discovery, semantic search, and database internals.
---

<header>
  <h1>Lam Nguyen</h1>
  <p class="affiliation">Researcher, AI for Scientific Discovery</p>
  <nav class="links" aria-label="Profiles">
    <a href="https://github.com/lamng3">GitHub</a>
    <a href="https://scholar.google.com/citations?user=ws80Q0IAAAAJ">Scholar</a>
    <a href="https://leetcode.com/u/triplethread/">LeetCode</a>
  </nav>
</header>

<section id="about">
  <p><strong>I play with semantic search and database internals.</strong></p>
  <p>I am a researcher working on AI for scientific discovery. My research focuses on designing algorithms and building a semantic data layer for LLMs: getting the right context to a model, from the right source, at a bounded cost. I approach LLM reasoning through the lens of databases, making retrieval trustworthy, context-aware, and cache-aware. I hold an M.S. in Computer Science from <a href="https://case.edu">Case Western Reserve University</a>, advised by <a href="https://yinghwu.github.io">Dr. Yinghui Wu</a>, with a <a href="https://etd.ohiolink.edu/acprod/odb_etd/ws/send_file/send?accession=case1751987504689716&amp;disposition=inline">thesis</a> on ontology matching with knowledge retrieval and efficient language models.</p>
  <p>In practice that means a few connected threads. Database systems, in <a href="https://github.com/lamng3/OntoDB">OntoDB</a>, a database management system for ontologies supporting SPARQL. Natural language interfaces to databases (NLIDB), in <a href="https://github.com/lamng3/hermes">Hermes</a>, a library that turns questions into SPARQL. Query validation, in <a href="https://github.com/cwru-sdle/OntoCheck">OntoCheck</a>, which checks whether an ontology can answer the questions its domain asks. Retrieval-grounded matching, in <a href="https://arxiv.org/abs/2507.14032">KROMA</a>, which retrieves context for an LLM to align ontologies. And long-horizon, memory-augmented agents for scientific discovery in cost-bounded settings, in <a href="https://github.com/lamng3/moira">MOIRA</a>, steered by a harness of small decision models.</p>
  <figure class="stack" aria-label="Research stack">
    <div class="layer goal"><span class="name">Goal</span><span class="role">Scientific discovery</span></div>
    <div class="layer"><span class="name">Agents</span><span class="role"><a href="https://github.com/lamng3/moira">MOIRA</a>: memory-augmented, cost-bounded agents</span></div>
    <div class="layer"><span class="name">Interface</span><span class="role"><a href="https://github.com/lamng3/hermes">Hermes</a>: natural-language questions to SPARQL</span></div>
    <div class="layer"><span class="name">Trust</span><span class="role"><a href="https://github.com/cwru-sdle/OntoCheck">OntoCheck</a>: query-driven ontology validation</span></div>
    <div class="layer"><span class="name">Integration</span><span class="role"><a href="https://arxiv.org/abs/2507.14032">KROMA</a>: retrieval-grounded ontology matching</span></div>
    <div class="layer"><span class="name">Database</span><span class="role"><a href="https://github.com/lamng3/OntoDB">OntoDB</a>: database management system for ontologies</span></div>
  </figure>
  <p>Before this I trained competitive programming, reaching the top 1.26% in <a href="https://leetcode.com/u/triplethread/">LeetCode contests</a> with 1000+ problems solved, and I still find data structures and algorithms a useful lens for thinking about agentic memory.</p>
  <p>Reaching me is O(log log log n), practically a constant. Please feel free to reach out at lamng3.work [at] gmail [dot] com if you'd like to talk about any of the above.</p>
</section>

<section id="experiences">
  <h2>Experiences</h2>
  <ul class="post-list">
    <li><span><strong>Microsoft</strong> · Software Engineer, <a href="https://www.microsoft.com/en-us/security/business/security-101/what-is-agentic-ai-security">Agentic Security</a></span><time>2025</time></li>
    <li><span><strong>Microsoft</strong> · Software Engineer Intern, <a href="https://www.microsoft.com/en-us/security/business/ai-machine-learning/microsoft-security-copilot">Security Copilot</a></span><time>2024</time></li>
    <li><span><strong>Amazon</strong> · Software Engineer Intern, <a href="https://developer.amazon.com/en-US/alexa">Alexa Voice AI</a></span><time>2023</time></li>
    <li><span><strong>Microsoft</strong> · Software Engineer Intern, <a href="https://learn.microsoft.com/en-us/azure/data-factory/introduction">Azure Data Factory</a></span><time>2023</time></li>
    <li><span><strong>Microsoft</strong> · Software Engineer Intern, <a href="https://azure.microsoft.com/en-us/resources/cloud-computing-dictionary/what-is-a-data-governance">Azure Data Governance</a></span><time>2022</time></li>
  </ul>
</section>

<section id="publications">
  <h2>Selected Publications</h2>
  <ol class="entries pubs">
    <li>
      <span class="authors">L. Nguyen, E. Frakes, H. Ma, O. Dernek, R. H. French, and Y. Wu.</span>
      <span class="ptitle">MOIRA: Memory-Augmented Ontology Integration with Cost-Bounded Reasoning Agents.</span>
      <a href="https://github.com/lamng3/moira">[Code]</a>
    </li>
    <li>
      <span class="authors">L. Nguyen, E. Barcelos, R. French, and Y. Wu.</span>
      <span class="ptitle">KROMA: Ontology Matching with Knowledge Retrieval and Large Language Models.</span>
      <span class="venue">International Semantic Web Conference (ISWC)</span>, 2025.
      <a href="https://arxiv.org/abs/2507.14032">[Paper]</a>
      <a href="https://github.com/lamng3/kroma">[Code]</a>
    </li>
    <li>
      <span class="authors">R. Kundu, R. Mehdi, V. D. Tran, E. Frakes, A. Daundkar, M. Sumudumalie, V. S. Mandayam, J. A. Lample, M. Li, L. S. Bruckman, E. I. Barcelos, A. Sehirlioglu, R. H. French, and Y. Wu.</span>
      <span class="ptitle">OntoCheck: Query-Driven Ontology Assessments for Scientific Domain Applications.</span>
      <a href="https://github.com/cwru-sdle/OntoCheck/blob/main/SupplementaryMaterials/2605-KunduMehdiTran-OntoCheck-SupplementaryMaterial.pdf">[Paper]</a>
      <a href="https://github.com/cwru-sdle/OntoCheck">[Code]</a>
    </li>
    <li>
      <span class="authors">L. Nguyen.</span>
      <span class="ptitle">Ontology Matching with Knowledge Retrieval and Efficient Large Language Models.</span>
      <span class="venue">M.S. thesis, Case Western Reserve University</span>, 2025.
      <a href="https://etd.ohiolink.edu/acprod/odb_etd/ws/send_file/send?accession=case1751987504689716&amp;disposition=inline">[Thesis]</a>
    </li>
  </ol>
</section>

<section id="open-source">
  <h2>Open Source</h2>
  <ul class="entries">
    <li>
      <p class="title"><a href="https://github.com/lamng3/OntoDB">OntoDB</a><span class="meta">: Database management system for ontologies. RDF storage, SPARQL queries, B+ tree indexes, and ARIES recovery</span></p>
      <p class="links-inline"><a href="https://github.com/lamng3/OntoDB">Repository</a> · <a href="https://lamng3.github.io/ontodb-docs/">Documentation</a></p>
    </li>
    <li>
      <p class="title"><a href="https://github.com/lamng3/hermes">Hermes</a><span class="meta">: Natural language to SPARQL over ontologies, a Python library with swappable systems</span></p>
      <p class="links-inline"><a href="https://github.com/lamng3/hermes">Repository</a> · <a href="https://lamng3.github.io/hermes-docs/">Documentation</a></p>
    </li>
  </ul>
</section>

<section id="service">
  <h2>Service</h2>
  <p>Reviewing: Co-reviewer, IEEE BigData 2024.</p>
</section>
