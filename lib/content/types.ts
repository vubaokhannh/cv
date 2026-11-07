export type Locale = "en" | "vi";

export type ViewKey = "experience" | "projects" | "contact";

export type StreamHubNodeKey =
  | "player"
  | "state"
  | "api"
  | "auth"
  | "queue"
  | "worker"
  | "postgres"
  | "r2"
  | "payos";

export type KrelloNodeKey =
  | "kanban"
  | "socket_client"
  | "krello_api"
  | "socket_gateway"
  | "krello_redis"
  | "krello_auth"
  | "krello_db"
  | "notifications"
  | "media";

export type NodeKey = StreamHubNodeKey | KrelloNodeKey | string;

export interface NodeDetail {
  title: string;
  tag: string;
  resp: string;
  decision: string;
  stack: string;
}

export interface ArchNode {
  key: NodeKey;
  name: string;
  badge: string;
  desc: string;
  primary?: boolean;
}

export interface ArchTier {
  label: string;
  nodes: ArchNode[];
}

/** A data-flow connection between two diagram nodes (from → to). */
export interface ArchEdge {
  from: NodeKey;
  to: NodeKey;
  label: string;
}

export interface ProjectArchData {
  kicker: string;
  title: string;
  hint: string;
  diagram: string;
  diagramRight: string;
  tiers: ArchTier[];
  /** Connections drawn between nodes; omit for a plain tiered layout. */
  edges?: ArchEdge[];
  nodeDetails: Record<string, NodeDetail>;
  defaultNodeKey: string;
}

export interface Project {
  id?: "streamhub" | "krello" | string;
  spec: string;
  title: string;
  period: string;
  links: { label: string; href: string; primary?: boolean }[];
  highlights: string[];
  facts: { label: string; value: string }[];
  tech: string[];
  /** Shows the interactive architecture diagram inside a modal. */
  architecture?: boolean;
  archData?: ProjectArchData;
}

export interface Release {
  version: string;
  role: string;
  company: string;
  bullets?: string[];
  tone: "current" | "mid";
}

export interface Education {
  period: string;
  school: string;
  program: string;
  gpa: string;
}

export interface Content {
  meta: { title: string; description: string };
  ui: {
    topbar: {
      quickJump: string;
      switchLang: string;
      blog: string;
    };
    blog: {
      kicker: string;
      title: string;
      subtitle: string;
      description: string;
      back: string;
      minRead: string; // contains {n}
      empty: string;
      toc: string;
      sectionLink: string; // aria-label of the heading anchor
      author: { heading: string; bio: string; contact: string };
    };
    sidebar: {
      github: string;
      email: string;
      cv: string;
      skills: string;
      contact: string;
    };
    theme: { light: string; dark: string };
    contact: {
      kicker: string;
      title: string;
      aside: string;
      intro: string;
      email: string;
      phone: string;
      github: string;
      location: string;
      copy: string;
      open: string;
      call: string;
      downloadCv: string;
    };
    arch: {
      kicker: string;
      title: string;
      hint: string;
      diagram: string;
      diagramRight: string;
      responsibility: string;
      decision: string;
      stack: string;
      core: string;
      connections: string;
      show: string;
      hide: string;
      close: string;
      inspecting: string; // contains {tag}
    };
    tabs: { label: string; hint: string };
    projects: { kicker: string; title: string; aside: string };
    experience: {
      kicker: string;
      title: string;
      aside: string;
      work: string;
      education: string;
    };
    palette: {
      placeholder: string;
      esc: string;
      footerLeft: string;
      footerRight: string;
      viewHint: string; // contains {n}
      clipboard: string;
      copyEmail: string;
      switchTo: string; // contains {view}
    };
    toast: { copied: string; copyFailed: string };
  };
  profile: {
    role: string;
    tagline: string;
    location: string;
    summary: string;
  };
  skills: { label: string; value: string }[];
  views: {
    key: ViewKey;
    index: string;
    title: string;
    subtitle: string;
    short: string;
    /** Meta description of this view's page. */
    description: string;
    paletteName: string;
  }[];
  archTiers: ArchTier[];
  nodeDetails: Record<string, NodeDetail>;
  projects: Project[];
  releases: Release[];
  education: Education[];
}
