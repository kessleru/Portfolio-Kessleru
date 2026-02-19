function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-10 rounded-lg border-2 border-ctp-crust/20 bg-ctp-mantle shadow-lg sm:mt-12 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ctp-crust/40 bg-ctp-crust/30 px-4 py-1.5 text-[10px] sm:text-xs text-ctp-overlay-0 select-none">
        <span>
          © {year} <span className="text-ctp-accent">Kessleru</span>
        </span>
        <span className="flex items-center gap-3">
          <span>TypeScript</span>
          <span>UTF-8</span>
          <span>LF</span>
        </span>
      </div>
    </footer>
  );
}

export default Footer;
