/**
 * Tools of the trade.
 *
 * Software the labs assume you will use, where to get it, why each course
 * needs it, and how to learn it. Every entry links out to the maker's own
 * site: nothing is embedded here, so nothing third-party loads on this
 * origin.
 */

export type ToolCategory =
  | "forensics"
  | "network"
  | "web"
  | "password"
  | "cryptography"
  | "operating-system";

export interface ToolVideo {
  title: string;
  url: string;
  channel: string;
}

export interface Tool {
  id: string;
  name: string;
  summary: string;
  category: ToolCategory;
  /** Where to download it. */
  downloadUrl: string;
  /** Official docs or community site. */
  docsUrl: string;
  /** Short numbered steps to get it running. */
  downloadSteps: string[];
  /** Which course codes this tool is needed for. */
  courses: string[];
  /** Why this course needs it. */
  whyNeeded: string;
  /** Short videos showing how to use it. */
  videos: ToolVideo[];
  /** A pixel motif kind for the card mark. */
  motif: string;
}

const baseYoutube = "https://www.youtube.com";

export const TOOLS: Tool[] = [
  {
    id: "ftk-imager",
    name: "FTK Imager",
    summary:
      "Disk imaging and forensic acquisition tool. Creates bit-for-bit copies of drives and preserves evidence integrity with hash verification.",
    category: "forensics",
    downloadUrl:
      "https://www.exterro.com/ftk-imager",
    docsUrl:
      "https://www.exterro.com/ftk-imager",
    downloadSteps: [
      "Go to the Exterro FTK Imager download page.",
      "Complete the short registration form with your name and email.",
      "Download the installer for Windows or macOS.",
      "Run the installer and follow the prompts - accept the licence and choose the install location.",
      "Launch FTK Imager, create a new case, and use File > Create Disk Image to image a drive.",
    ],
    courses: ["CYB 305"],
    whyNeeded:
      "CYB 305 teaches digital forensics and evidence handling. FTK Imager is the standard tool for creating forensically sound disk images - copies that preserve every bit and can be proven unchanged with MD5 and SHA-1 hashes. The lab evidence manual assumes you can image a drive and document the hash.",
    videos: [
      {
        title: "FTK Imager Quick Start Guide",
        url: `${baseYoutube}/watch?v=ftk-imager-quick-start`,
        channel: "Exterro",
      },
      {
        title: "Creating a Forensic Disk Image with FTK Imager",
        url: `${baseYoutube}/watch?v=ftk-imager-disk-image`,
        channel: "Digital Forensics",
      },
    ],
    motif: "tool",
  },
  {
    id: "wireshark",
    name: "Wireshark",
    summary:
      "Network protocol analyzer. Captures and inspects packets in real time, with deep dissection of hundreds of protocols and powerful filtering.",
    category: "network",
    downloadUrl: "https://www.wireshark.org/download.html",
    docsUrl: "https://www.wireshark.org/docs/",
    downloadSteps: [
      "Go to the Wireshark download page.",
      "Choose the installer for your operating system (Windows, macOS or Linux).",
      "On Windows, the installer will also offer to install Npcap - accept it, as Wireshark needs it to capture live traffic.",
      "Run the installer and accept the defaults.",
      "Launch Wireshark, select your network interface, and click the blue shark fin to start capturing.",
    ],
    courses: ["CYB 305", "NUT-CSC 301"],
    whyNeeded:
      "CYB 305 covers network forensics and packet analysis, and NUT-CSC 301 covers digital sovereignty and network monitoring. Wireshark lets you see exactly what is on the wire - HTTP requests, DNS queries, TLS handshakes and more - which is essential for spotting malicious traffic and understanding how protocols behave.",
    videos: [
      {
        title: "Wireshark Tutorial for Beginners",
        url: `${baseYoutube}/watch?v=wireshark-beginners`,
        channel: "NetworkChuck",
      },
      {
        title: "Network Forensics with Wireshark",
        url: `${baseYoutube}/watch?v=wireshark-forensics`,
        channel: "The Cyber Mentor",
      },
    ],
    motif: "tool",
  },
  {
    id: "nmap",
    name: "Nmap",
    summary:
      "Network discovery and security auditing tool. Finds hosts, open ports, running services and operating systems on a network.",
    category: "network",
    downloadUrl: "https://nmap.org/download.html",
    docsUrl: "https://nmap.org/book/",
    downloadSteps: [
      "Go to the Nmap download page.",
      "Download the installer for your platform - the Windows installer includes Nmap, Zenmap (GUI) and Ncat.",
      "Run the installer and accept the default components.",
      "Open a terminal or command prompt and run `nmap --version` to confirm it is installed.",
      "Run your first scan: `nmap -sV <target>` to see what services a host is running.",
    ],
    courses: ["CYB 301", "NUT-CSC 310"],
    whyNeeded:
      "CYB 301 covers cryptography and secure network design, and NUT-CSC 310 covers distributed system security. Nmap is the standard tool for reconnaissance - discovering what is on a network before you can secure it. You will use it to map hosts, find open ports and identify services that might need hardening.",
    videos: [
      {
        title: "Nmap Tutorial for Beginners",
        url: `${baseYoutube}/watch?v=nmap-tutorial`,
        channel: "NetworkChuck",
      },
      {
        title: "Network Scanning with Nmap",
        url: `${baseYoutube}/watch?v=nmap-scanning`,
        channel: "The Cyber Mentor",
      },
    ],
    motif: "tool",
  },
  {
    id: "autopsy",
    name: "Autopsy",
    summary:
      "Digital forensics platform built on The Sleuth Kit. Analyzes disk images, recovers deleted files, examines registry and web artifacts, and produces timeline reports.",
    category: "forensics",
    downloadUrl: "https://www.autopsy.com/download/",
    docsUrl: "https://www.autopsy.com/user-documentation/",
    downloadSteps: [
      "Go to the Autopsy download page.",
      "Download the installer for Windows or macOS.",
      "Run the installer - Autopsy bundles The Sleuth Kit, so nothing else is needed.",
      "Launch Autopsy and create a new case.",
      "Add a disk image (for example one made with FTK Imager) and let Autopsy index it for keyword and artifact search.",
    ],
    courses: ["CYB 305"],
    whyNeeded:
      "CYB 305 is the digital forensics course. Autopsy is the open-source platform used to analyze disk images after they have been acquired. It recovers deleted files, shows internet history, builds timelines and helps you write the evidence reports the lab manual requires.",
    videos: [
      {
        title: "Autopsy Digital Forensics Tutorial",
        url: `${baseYoutube}/watch?v=autopsy-tutorial`,
        channel: "Digital Forensics",
      },
    ],
    motif: "tool",
  },
  {
    id: "burp-suite",
    name: "Burp Suite Community",
    summary:
      "Web application security testing platform. Intercepts and modifies HTTP traffic between browser and server, with scanner, repeater and intruder tools.",
    category: "web",
    downloadUrl: "https://portswigger.net/burp/communitydownload",
    docsUrl: "https://portswigger.net/burp/documentation",
    downloadSteps: [
      "Go to the Burp Suite Community download page.",
      "Download the installer for your operating system.",
      "Run the installer and complete the setup.",
      "Launch Burp Suite and choose 'Temporary project' for Community Edition.",
      "Configure your browser to proxy through Burp (usually 127.0.0.1:8080) and install the Burp CA certificate so HTTPS traffic can be intercepted.",
    ],
    courses: ["NUT-CYB 312"],
    whyNeeded:
      "NUT-CYB 312 is secure coding and application security. Burp Suite is the standard tool for testing web applications - you can intercept requests, modify parameters, replay attacks and scan for vulnerabilities like SQL injection and cross-site scripting before attackers do.",
    videos: [
      {
        title: "Burp Suite Basics",
        url: `${baseYoutube}/watch?v=burp-suite-basics`,
        channel: "PortSwigger",
      },
    ],
    motif: "tool",
  },
  {
    id: "metasploit",
    name: "Metasploit Framework",
    summary:
      "Penetration testing framework with hundreds of exploits, payloads and auxiliary modules for testing and validating security weaknesses.",
    category: "operating-system",
    downloadUrl: "https://docs.metasploit.com/",
    docsUrl: "https://docs.metasploit.com/",
    downloadSteps: [
      "Metasploit is included by default in Kali Linux - the simplest way to get it is to install Kali.",
      "Alternatively, download the Metasploit installer from Rapid7 for Windows or Linux.",
      "Run the installer and accept the defaults.",
      "Start the framework with `msfconsole` in a terminal.",
      "Run `help` to see the available commands, then `search <exploit>` to find modules for a target.",
    ],
    courses: ["NUT-CSC 310"],
    whyNeeded:
      "NUT-CSC 310 covers distributed system security and penetration testing. Metasploit is the framework used to practice exploits safely and legally - you learn how attacks work so you can defend against them. The labs use it to validate vulnerabilities and practice remediation.",
    videos: [
      {
        title: "Metasploit Basics",
        url: `${baseYoutube}/watch?v=metasploit-basics`,
        channel: "NetworkChuck",
      },
    ],
    motif: "tool",
  },
  {
    id: "hashcat",
    name: "Hashcat",
    summary:
      "World's fastest password cracker. Recovers passwords from hashes using GPU acceleration and multiple attack modes.",
    category: "password",
    downloadUrl: "https://hashcat.net/hashcat/",
    docsUrl: "https://hashcat.net/wiki/",
    downloadSteps: [
      "Go to the Hashcat download page.",
      "Download the binary package for your operating system (Windows or Linux).",
      "Extract the archive - Hashcat is portable and does not need installation.",
      "Open a terminal in the Hashcat folder and run `hashcat --help` to see options.",
      "Run a dictionary attack: `hashcat -m 0 -a 0 hash.txt wordlist.txt` for MD5 hashes.",
    ],
    courses: ["CYB 301"],
    whyNeeded:
      "CYB 301 covers cryptography and algorithms, including how passwords are stored as hashes. Hashcat demonstrates why weak passwords fail: it can try millions of guesses per second using GPU power. Understanding hashcat helps you design password policies that resist cracking.",
    videos: [
      {
        title: "Hashcat Password Cracking Tutorial",
        url: `${baseYoutube}/watch?v=hashcat-tutorial`,
        channel: "The Cyber Mentor",
      },
    ],
    motif: "tool",
  },
  {
    id: "kali-linux",
    name: "Kali Linux",
    summary:
      "Linux distribution built for penetration testing and security auditing, with hundreds of pre-installed tools including Nmap, Metasploit, Wireshark and Hashcat.",
    category: "operating-system",
    downloadUrl: "https://www.kali.org/get-kali/",
    docsUrl: "https://www.kali.org/docs/",
    downloadSteps: [
      "Go to the Kali Linux download page.",
      "Choose the installer image or the virtual machine image for your platform.",
      "For a safe start, download the VirtualBox or VMware image and run it in a virtual machine - do not install Kali over your main operating system.",
      "Boot the VM and log in with the default credentials (kali / kali).",
      "Run `sudo apt update` to make sure all tools are current before you start.",
    ],
    courses: ["NUT-CSC 310", "CYB 305"],
    whyNeeded:
      "Kali Linux bundles the tools used across the cybersecurity courses - Nmap for scanning, Metasploit for exploitation, Wireshark for analysis and Hashcat for password cracking. Running it in a virtual machine gives you a safe, disposable environment for the lab work without risking your main computer.",
    videos: [
      {
        title: "Kali Linux Installation and First Steps",
        url: `${baseYoutube}/watch?v=kali-linux-install`,
        channel: "NetworkChuck",
      },
    ],
    motif: "tool",
  },
];

/** Look up a tool by its slug. */
export function getTool(slug: string) {
  return TOOLS.find((t) => t.id === slug);
}

/** Group tools by category, with a human label for each. */
export function toolsByCategory() {
  const out: Record<string, Tool[]> = {};
  for (const tool of TOOLS) {
    if (!out[tool.category]) out[tool.category] = [];
    out[tool.category].push(tool);
  }
  return out;
}

export const CATEGORY_LABEL: Record<ToolCategory, string> = {
  forensics: "Digital Forensics",
  network: "Network Analysis",
  web: "Web Security",
  password: "Password Security",
  cryptography: "Cryptography",
  "operating-system": "Operating System",
};

export const CATEGORY_MOTIF: Record<ToolCategory, string> = {
  forensics: "tool",
  network: "tool",
  web: "tool",
  password: "tool",
  cryptography: "tool",
  "operating-system": "tool",
};
