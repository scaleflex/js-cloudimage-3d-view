import { CI3DView } from '../src/core/ci-3d-view';
import { parseDataAttributes } from '../src/core/config';
import { initConfigurator } from './configurator';

// ===== Helpers =====

/** Remove the placeholder overlay from a container and return true if one was found. */
function removePlaceholder(container: HTMLElement): boolean {
  const placeholder = container.querySelector('.viewer-placeholder');
  if (placeholder) {
    placeholder.remove();
    return true;
  }
  return false;
}

/** Swap all `data-ci-3d-lazy-*` attributes to `data-ci-3d-*` on an element. */
function promoteLazyAttributes(el: HTMLElement): void {
  const toRename: { old: string; new_: string; value: string }[] = [];
  for (const attr of Array.from(el.attributes)) {
    if (attr.name.startsWith('data-ci-3d-lazy-')) {
      const promoted = attr.name.replace('data-ci-3d-lazy-', 'data-ci-3d-');
      toRename.push({ old: attr.name, new_: promoted, value: attr.value });
    }
  }
  for (const { old, new_, value } of toRename) {
    el.removeAttribute(old);
    el.setAttribute(new_, value);
  }
}

/** Enable all input/select/button controls inside a container. */
function enableControls(container: HTMLElement): void {
  container.querySelectorAll<HTMLElement>('input, select, button').forEach((ctrl) => {
    ctrl.removeAttribute('disabled');
  });
}

// ===== Apply saved preview images to placeholders =====
document.querySelectorAll<HTMLElement>('.viewer-placeholder[data-preview]').forEach((ph) => {
  const src = ph.dataset.preview;
  if (src) {
    ph.style.backgroundImage = `url(${src})`;
  }
});

// ===== Auto-init viewers with data attributes (hero only now) =====
CI3DView.autoInit();

// ===== Lazy-init format card viewers =====
document.querySelectorAll<HTMLElement>('[data-ci-3d-lazy-src]').forEach((el) => {
  const placeholder = el.querySelector('.viewer-placeholder');
  if (!placeholder) return;

  placeholder.addEventListener('click', () => {
    removePlaceholder(el);
    promoteLazyAttributes(el);
    const config = parseDataAttributes(el);
    new CI3DView(el, config);
  }, { once: true });
});

// ===== Lighting Demo =====
let lightingInstance: InstanceType<typeof CI3DView> | null = null;
const lightingContainer = document.getElementById('lighting-viewer');
if (lightingContainer) {
  const lightingPlaceholder = lightingContainer.querySelector('.viewer-placeholder');

  const initLighting = () => {
    removePlaceholder(lightingContainer);

    lightingInstance = new CI3DView(lightingContainer, {
      src: 'https://fbmjmuoeb.filerobot.com/3D%20Models/colored.stl?vh=0975df&func=proxy',
      autoRotate: true,
      shadows: true,
      toneMapping: 'aces',
      screenshotButton: true,
      alt: 'Lighting demo model',
      onError: (err) => console.error('[Lighting]', err),
    });

    // Enable sidebar controls
    const controlsPanel = lightingContainer.closest('.demo-panel')?.querySelector('.demo-panel__controls');
    if (controlsPanel) enableControls(controlsPanel as HTMLElement);

    const shadowsCtrl = document.getElementById('ctrl-shadows') as HTMLInputElement;
    const tonemapCtrl = document.getElementById('ctrl-tonemapping') as HTMLSelectElement;
    const exposureCtrl = document.getElementById('ctrl-exposure') as HTMLInputElement;
    const exposureVal = document.getElementById('ctrl-exposure-val');
    const themeCtrl = document.getElementById('ctrl-lighting-theme') as HTMLSelectElement;

    shadowsCtrl?.addEventListener('change', () => {
      lightingInstance?.update({ shadows: shadowsCtrl.checked });
    });

    tonemapCtrl?.addEventListener('change', () => {
      lightingInstance?.update({ toneMapping: tonemapCtrl.value as any });
    });

    exposureCtrl?.addEventListener('input', () => {
      const val = parseFloat(exposureCtrl.value);
      if (exposureVal) exposureVal.textContent = val.toFixed(1);
      lightingInstance?.update({ toneMappingExposure: val });
    });

    themeCtrl?.addEventListener('change', () => {
      lightingInstance?.update({ theme: themeCtrl.value as any });
    });
  };

  if (lightingPlaceholder) {
    lightingPlaceholder.addEventListener('click', initLighting, { once: true });
  } else {
    initLighting();
  }
}

// ===== Animation Demo =====
let animInstance: InstanceType<typeof CI3DView> | null = null;
const animContainer = document.getElementById('animation-viewer');
if (animContainer) {
  const animPlaceholder = animContainer.querySelector('.viewer-placeholder');

  const initAnimation = () => {
    removePlaceholder(animContainer);

    animInstance = new CI3DView(animContainer, {
      src: 'https://fbmjmuoeb.filerobot.com/3D%20Models/Samba%20Dancing.fbx?vh=4ad183&func=proxy',
      autoPlayAnimation: true,
      shadows: true,
      screenshotButton: true,
      backgroundToggleButton: true,
      alt: 'Animated dancing character',
      onError: (err) => console.error('[Animation]', err),
    });

    // Enable sidebar controls
    const controlsPanel = animContainer.closest('.demo-panel')?.querySelector('.demo-panel__controls');
    if (controlsPanel) enableControls(controlsPanel as HTMLElement);

    document.getElementById('anim-play')?.addEventListener('click', () => {
      animInstance?.playAnimation();
    });

    document.getElementById('anim-pause')?.addEventListener('click', () => {
      animInstance?.pauseAnimation();
    });

    document.getElementById('anim-stop')?.addEventListener('click', () => {
      animInstance?.stopAnimation();
    });

    const speedCtrl = document.getElementById('anim-speed') as HTMLInputElement;
    const speedVal = document.getElementById('anim-speed-val');
    speedCtrl?.addEventListener('input', () => {
      const val = parseFloat(speedCtrl.value);
      if (speedVal) speedVal.textContent = `${val.toFixed(1)}x`;
      animInstance?.setAnimationSpeed(val);
    });
  };

  if (animPlaceholder) {
    animPlaceholder.addEventListener('click', initAnimation, { once: true });
  } else {
    initAnimation();
  }
}

// ===== Interactive Configurator =====
const configuratorContainer = document.getElementById('configurator-viewer');
if (configuratorContainer) {
  const configPlaceholder = configuratorContainer.querySelector('.viewer-placeholder');

  const initConfig = () => {
    removePlaceholder(configuratorContainer);
    initConfigurator(configuratorContainer);
  };

  if (configPlaceholder) {
    configPlaceholder.addEventListener('click', initConfig, { once: true });
  } else {
    initConfig();
  }
}

// ===== Burger Menu =====
const burger = document.getElementById('burger');
const navLinks = document.getElementById('nav-links');
burger?.addEventListener('click', () => {
  const isOpen = navLinks?.classList.toggle('open');
  burger.setAttribute('aria-expanded', String(!!isOpen));
});

// Close menu on link click
navLinks?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    burger?.setAttribute('aria-expanded', 'false');
  });
});

// ===== Nav scroll shadow =====
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav?.classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });

// ===== Scroll-aware nav highlighting =====
const sections = document.querySelectorAll('section[id], .demo-hero[id]');
const navLinkElements = document.querySelectorAll('.demo-nav-links a');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinkElements.forEach((link) => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  },
  { rootMargin: '-50% 0px -50% 0px' },
);

sections.forEach((section) => observer.observe(section));

// ===== Copy to clipboard (old-style text-swap buttons) =====
document.querySelectorAll('.code-block__copy').forEach((btn) => {
  btn.addEventListener('click', () => {
    const text =
      (btn as HTMLElement).dataset.copy ||
      btn.closest('.code-block')?.querySelector('code')?.textContent ||
      '';
    navigator.clipboard.writeText(text).then(() => {
      const original = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => {
        btn.textContent = original;
      }, 2000);
    });
  });
});

// ===== Copy to clipboard (new icon-style buttons) =====
document.querySelectorAll('.demo-copy-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const code = btn.closest('.demo-code-wrap')?.querySelector('code');
    if (!code) return;
    navigator.clipboard.writeText(code.textContent || '').then(() => {
      btn.classList.add('copied');
      setTimeout(() => btn.classList.remove('copied'), 2000);
    });
  });
});

// ===== "Also by Scaleflex" Carousel =====
{
  const slides = document.querySelectorAll<HTMLElement>('.demo-also-slide');
  const dotsContainer = document.getElementById('also-dots');
  if (slides.length > 0 && dotsContainer) {
    let current = 0;
    let animating = false;
    let timer: ReturnType<typeof setInterval>;

    for (let i = 0; i < slides.length; i++) {
      const dot = document.createElement('button');
      dot.className = `demo-also-dot${i === 0 ? ' demo-also-dot--active' : ''}`;
      dot.setAttribute('aria-label', `Slide ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(dot);
    }

    function clearAnimClasses(el: HTMLElement) {
      el.classList.remove(
        'demo-also-slide--enter-right', 'demo-also-slide--enter-left',
        'demo-also-slide--leave-left', 'demo-also-slide--leave-right',
      );
    }

    function goTo(index: number) {
      if (index === current || animating) return;
      animating = true;
      const forward = index > current || (current === slides.length - 1 && index === 0);
      const prev = slides[current];
      const next = slides[index];

      clearAnimClasses(prev);
      prev.classList.remove('demo-also-slide--active');
      prev.classList.add(forward ? 'demo-also-slide--leave-left' : 'demo-also-slide--leave-right');

      clearAnimClasses(next);
      next.classList.add(forward ? 'demo-also-slide--enter-right' : 'demo-also-slide--enter-left');

      next.addEventListener('animationend', function handler() {
        next.removeEventListener('animationend', handler);
        clearAnimClasses(prev);
        clearAnimClasses(next);
        next.classList.add('demo-also-slide--active');
        animating = false;
      });

      current = index;
      dotsContainer!.querySelectorAll('.demo-also-dot').forEach((d, i) => {
        d.classList.toggle('demo-also-dot--active', i === current);
      });
      resetTimer();
    }

    function resetTimer() {
      clearInterval(timer);
      timer = setInterval(() => {
        goTo((current + 1) % slides.length);
      }, 5000);
    }

    resetTimer();
  }
}

// ===== Dev-only: Preview Image Generator =====
// Renders each model in a temporary container, screenshots it, and downloads the PNG.
// Run once with `npm run dev`, click the button, save images to demo/previews/.
// Uncomment when you need to regenerate previews (e.g. after adding new formats).
//
// if (import.meta.env.DEV) {
//   const PREVIEW_MODELS: { name: string; src: string; options?: Partial<Parameters<typeof CI3DView.prototype.update>[0]> }[] = [
//     { name: 'glb', src: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/DamagedHelmet/glTF-Binary/DamagedHelmet.glb', options: { shadows: true, autoRotate: false } },
//     { name: 'obj', src: 'https://fbmjmuoeb.filerobot.com/3D%20Models/craneo.obj?vh=c8c155&func=proxy', options: { shadows: true } },
//     { name: 'stl', src: 'https://fbmjmuoeb.filerobot.com/3D%20Models/colored.stl?vh=0975df&func=proxy', options: { shadows: true } },
//     { name: 'fbx', src: 'https://fbmjmuoeb.filerobot.com/3D%20Models/Samba%20Dancing.fbx?vh=4ad183&func=proxy', options: { shadows: true } },
//     { name: '3ds', src: 'https://fbmjmuoeb.filerobot.com/3D%20Models/House.3DS?vh=148188&func=proxy', options: { shadows: true } },
//     { name: 'amf', src: 'https://raw.githubusercontent.com/jscad/sample-files/master/amf/Rook.amf', options: { shadows: true } },
//     { name: 'lighting', src: 'https://fbmjmuoeb.filerobot.com/3D%20Models/colored.stl?vh=0975df&func=proxy', options: { shadows: true, toneMapping: 'aces' as const } },
//     { name: 'animation', src: 'https://fbmjmuoeb.filerobot.com/3D%20Models/Samba%20Dancing.fbx?vh=4ad183&func=proxy', options: { shadows: true } },
//     { name: 'configurator', src: 'https://fbmjmuoeb.filerobot.com/3D%20Models/Turing-Borwo.stl?vh=828731&func=proxy', options: { shadows: true } },
//   ];
//
//   const btn = document.createElement('button');
//   btn.className = 'preview-gen-btn';
//   btn.textContent = 'Generate Previews';
//   document.body.appendChild(btn);
//
//   btn.addEventListener('click', async () => {
//     btn.disabled = true;
//     btn.textContent = 'Generating...';
//
//     const tmpContainer = document.createElement('div');
//     tmpContainer.style.cssText = 'position:fixed;top:0;left:-9999px;width:800px;height:600px;';
//     document.body.appendChild(tmpContainer);
//
//     for (const model of PREVIEW_MODELS) {
//       btn.textContent = `Rendering ${model.name}...`;
//       tmpContainer.innerHTML = '';
//
//       try {
//         const dataUrl = await new Promise<string>((resolve, reject) => {
//           const timeout = setTimeout(() => reject(new Error(`Timeout loading ${model.name}`)), 30000);
//
//           new CI3DView(tmpContainer, {
//             src: model.src,
//             ...model.options,
//             fullscreenButton: false,
//             screenshotButton: false,
//             showProgress: false,
//             onLoad: (instance) => {
//               clearTimeout(timeout);
//               requestAnimationFrame(() => {
//                 requestAnimationFrame(() => {
//                   const url = instance.screenshot(2);
//                   instance.destroy();
//                   resolve(url);
//                 });
//               });
//             },
//             onError: (err) => {
//               clearTimeout(timeout);
//               reject(err);
//             },
//           });
//         });
//
//         const a = document.createElement('a');
//         a.href = dataUrl;
//         a.download = `preview-${model.name}.png`;
//         document.body.appendChild(a);
//         a.click();
//         a.remove();
//
//         await new Promise((r) => setTimeout(r, 500));
//       } catch (err) {
//         console.error(`Failed to generate preview for ${model.name}:`, err);
//       }
//     }
//
//     tmpContainer.remove();
//     btn.textContent = 'Done! Check downloads';
//     btn.disabled = false;
//     setTimeout(() => { btn.textContent = 'Generate Previews'; }, 3000);
//   });
// }
