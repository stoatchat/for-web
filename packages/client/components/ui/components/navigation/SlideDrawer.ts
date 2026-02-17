const ANIM_MS = 500,
  TRIG_X = 20,
  CANCEL_Y = 20;

type TrackTouch = {
  id: number;
  x: number;
  y: number;
  newX?: number;
  newT?: number;
  prevX?: number;
  prevT?: number;
  trig?: boolean;
};

export class SlideDrawer {
  enabled = false;
  private media;
  private touch: TrackTouch | null = null;
  private tTmr: NodeJS.Timeout | null = null;
  private ofs = 0;

  constructor(
    private drawer: HTMLElement,
    private root: HTMLElement,
  ) {
    console.log("INIT", drawer, root);
    root.ontouchstart = this.start.bind(this);
    root.ontouchmove = root.ontouchend = this.move.bind(this);

    //Auto-enable based on device width
    const pwMax = getComputedStyle(document.body).getPropertyValue(
      "--phone-max-width",
    );
    this.media = matchMedia(`(max-width: ${pwMax}`);
    this.media.onchange = (e) => this.setEnabled(e.matches);
    this.setEnabled(this.media.matches);
  }

  private start(e: TouchEvent) {
    //Cancel if more than one finger
    if (e.touches.length > 1) {
      this.touch = null;
      return;
    }
    if (this.touch || !this.enabled) return;

    //Track this touch
    const t = e.touches[0];
    this.touch = {
      id: t.identifier,
      x: t.screenX,
      y: t.screenY,
    };

    console.log("TSTART", this.touch.x, this.touch.y);
  }

  private move(e: TouchEvent) {
    if (!this.touch) return;
    const isEnd = e.type === "touchend";
    let t, tNew;
    for (t of e.changedTouches)
      if (t.identifier === this.touch.id) {
        tNew = t;
        break;
      }
    if (!tNew) return;

    t = this.touch;
    const dy = tNew.screenY - t.y,
      ds = this.drawer.style,
      max = -innerWidth;
    let dx = tNew.screenX - t.x,
      trig = t.trig;

    if (!trig && Math.abs(dy) > CANCEL_Y) {
      console.log("CANCEL at Y", dy);
      this.touch = null;
    } else if (trig || Math.abs(dx) > TRIG_X) {
      if (!trig) {
        console.log("TRIG at X", dx);
        t.trig = trig = true;
        this.tfTimer();
      }

      dx = Math.max(Math.min(this.ofs + dx, 0), max);
      ds.transform = `translateX(${dx}px)`;
      e.preventDefault();
      e.stopPropagation();
    }

    if (isEnd) {
      console.log("END at X", dx);

      //TODO: Calc avg velocity and smooth w/ moving avg or something
      //If velocity at touchend is higher than threshold,
      //overrides the show/hide result regardless of drawer position

      //Finalize show/hide state
      if (trig) this.tfTimer(true, dx < max / 2);
      this.touch = null;
    }
  }

  private tfTimer(set = false, show = false) {
    //Animate transition
    const ds = this.drawer.style;
    this.setElState(false);
    if (set) {
      this.ofs = show ? -innerWidth : 0;
      ds.transition = `transform ${ANIM_MS}ms`;
      ds.transform = `translateX(${this.ofs}px)`;
    } else {
      ds.transition = ds.transform = "";
    }

    //Finalize after delay
    clearTimeout(this.tTmr!);
    this.tTmr = set
      ? setTimeout(() => {
          ds.transition = ds.transform = "";
          this.setElState(show);
          this.tTmr = null;
        }, ANIM_MS + 50)
      : null;
  }

  private setElState(show: boolean) {
    const ds = this.drawer.style;
    this.root.style.width = show ? "" : "200vw";
    ds.marginLeft = show ? "" : "100vw";
  }

  delete() {
    console.log("DEL");
    this.setEnabled(false);
    this.root.ontouchstart =
      this.root.ontouchmove =
      this.root.ontouchend =
      this.media.onchange =
        null;
  }

  setEnabled(en: boolean) {
    if (this.enabled !== en) {
      this.drawer.style.zIndex = en ? "1" : "";
      this.tfTimer();
      this.touch = null;
      if (!en) this.setElState(true);
      this.ofs = 0;
    }
    this.enabled = en;
  }

  isShown() {
    return this.ofs !== 0;
  }

  setShown(show: boolean) {
    if (!this.enabled || this.touch?.trig || this.tTmr) return false;
    if (this.isShown() !== show) {
      this.setElState(false);
      this.drawer.style.transform = `translateX(${this.ofs}px)`;
      setTimeout(() => this.tfTimer(true, show), 0);
    }
    return true;
  }
}
