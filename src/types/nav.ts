export interface NavChild {
  label: string;
  href: string;
}

export interface NavItem {
  label: string;
  /** Omitted = dropdown label only, not a link (e.g. "Who We Are"). */
  href?: string;
  children?: NavChild[];
}

export interface NavData {
  primary: NavItem[];
}
