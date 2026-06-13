import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

gsap.registerPlugin(useGSAP);

const HIDDEN_CLIP = 'inset(0% 0% 100% 0%)';
const REVEALED_CLIP = 'inset(0% 0% 0% 0%)';

export interface ColorWipeOptions {
  /** Horizontal distance (px) between adjacent swatch centres. */
  swatchStep: number;
}

export interface ColorWipe {
  /** Attach to the element that scopes all GSAP work (auto-cleanup). */
  scopeRef: RefObject<HTMLDivElement | null>;
  /** Attach to the image layer that wipes in the incoming colour. */
  overlayRef: RefObject<HTMLDivElement | null>;
  /** Attach to the selection ring that slides between swatches. */
  ringRef: RefObject<HTMLDivElement | null>;
  /** Committed colourway (base image layer). */
  selectedIndex: number;
  /** Colourway currently wiping in (overlay image layer). */
  incomingIndex: number;
  /** Begin transition to colourway `index`. No-op while animating. */
  selectColor: (index: number) => void;
}

/**
 * Colour-change interaction from the motion reference:
 *  1. the selection ring slides to the tapped swatch (back.out),
 *  2. the new colourway image wipes top→bottom over the current one
 *     (clip-path inset tween — composited, no layout work).
 *
 * Built per the official GSAP skills (github.com/greensock/gsap-skills):
 * one timeline per interaction, useGSAP scope for automatic cleanup,
 * contextSafe for event handlers, re-entrancy locked via ref.
 *
 * Commit choreography — double buffering / layer promotion. After the wipe
 * the overlay already shows the correct colour, so it simply STAYS fully
 * revealed; the base syncs to the same colour underneath while completely
 * covered (an invisible change by construction). The overlay is only
 * re-hidden at the START of the next selection — at that moment the base
 * has held the committed colour for as long as the user took to tap again,
 * so revealing it swaps between two identical frames. No step depends on
 * GSAP mutations and React commits landing in the same paint, which is why
 * this cannot flash: earlier designs hid the overlay at commit time and
 * raced the browser's async render/decide-to-paint pipeline.
 */
export function useColorWipe({ swatchStep }: ColorWipeOptions): ColorWipe {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [incomingIndex, setIncomingIndex] = useState(0);
  const isAnimating = useRef(false);

  const scopeRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const reducedMotion = usePrefersReducedMotion();

  const { contextSafe } = useGSAP(
    () => {
      gsap.set(overlayRef.current, { clipPath: HIDDEN_CLIP });
    },
    { scope: scopeRef },
  );

  // GSAP's contextSafe wraps a handler; it does NOT read refs during
  // render. The official @gsap/react skills use exactly this pattern, but
  // the new react-hooks lint flags any function call that receives refs.
  // eslint-disable-next-line react-hooks/refs
  const selectColor = contextSafe((index: number) => {
    if (index === selectedIndex || isAnimating.current) return;
    isAnimating.current = true;

    // retire the previous wipe: hide the overlay NOW, while base and overlay
    // display identical pixels (the base committed after the last wipe), then
    // let React flip the hidden overlay's content to the new colourway
    gsap.set(overlayRef.current, { clipPath: HIDDEN_CLIP });
    setIncomingIndex(index);

    const speed = reducedMotion ? 0 : 1;
    gsap
      .timeline({
        defaults: { ease: 'power2.inOut' },
        // Commit only. The overlay deliberately STAYS fully revealed
        // (layer promotion — see hook doc); it is re-hidden at the start
        // of the next selection, when base and overlay pixels are identical.
        onComplete: () => setSelectedIndex(index),
      })
      .to(
        ringRef.current,
        { x: index * swatchStep, duration: 0.45 * speed, ease: 'back.out(1.4)' },
        0,
      )
      .fromTo(
        overlayRef.current,
        { clipPath: HIDDEN_CLIP },
        { clipPath: REVEALED_CLIP, duration: 0.7 * speed },
        0.05 * speed,
      );
  });

  // Unlock only after the base has committed the new colour, so an
  // immediate next tap can safely retire the overlay.
  useLayoutEffect(() => {
    isAnimating.current = false;
  }, [selectedIndex]);

  return { scopeRef, overlayRef, ringRef, selectedIndex, incomingIndex, selectColor };
}
