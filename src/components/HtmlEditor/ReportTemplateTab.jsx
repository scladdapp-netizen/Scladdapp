import { useMemo } from "react";
import {
  detectReportSection,
  applyReportSectionLayout,
  applyReportSectionColor,
  applyReportSectionBackground,
  resetReportSection,
  getSectionLayouts,
  SECTION_COLOR_PRESETS,
  SECTION_BG_PRESETS,
  SECTION_BG_AUTO,
  DEFAULT_SECTION_COLOR,
} from "../../utils/reportSectionTemplates";

function cssMapToReact(map) {
  if (!map) return {};
  const out = {};
  Object.entries(map).forEach(([k, v]) => {
    const camel = k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = v;
  });
  return out;
}

function MiniTablePreview({ template }) {
  const th = cssMapToReact(template.th);
  const td = cssMapToReact(template.td);
  const thead = cssMapToReact(template.thead);
  const odd = cssMapToReact(template.trOdd);
  const even = cssMapToReact(template.trEven);
  return (
    <table className="mrp-table-theme__mini" style={cssMapToReact(template.table)}>
      <thead style={thead}>
        <tr>
          <th style={th}>A</th>
          <th style={th}>B</th>
        </tr>
      </thead>
      <tbody>
        <tr style={odd}>
          <td style={td}>1</td>
          <td style={td}>2</td>
        </tr>
        <tr style={even}>
          <td style={td}>3</td>
          <td style={td}>4</td>
        </tr>
      </tbody>
    </table>
  );
}

function HeaderLayoutPreview({ layoutId, color }) {
  const accent = color || DEFAULT_SECTION_COLOR;
  if (layoutId === "centered" || layoutId === "official") {
    return (
      <div className="rtp-mini rtp-mini--header" style={{ textAlign: "center" }}>
        <div className="rtp-mini__logo" style={{ margin: "0 auto", background: accent }} />
        <div className="rtp-mini__bar" style={{ background: accent, width: "70%", margin: "4px auto 0" }} />
        <div className="rtp-mini__line" />
      </div>
    );
  }
  if (layoutId === "banner-top") {
    return (
      <div className="rtp-mini rtp-mini--header rtp-mini--col">
        <div className="rtp-mini__bar" style={{ background: accent, width: "100%", height: 8, borderRadius: 2 }} />
        <div className="rtp-mini__logo" style={{ margin: "4px auto 0", background: accent }} />
        <div className="rtp-mini__line" />
      </div>
    );
  }
  if (layoutId === "split" || layoutId === "wide-logo") {
    return (
      <div className="rtp-mini rtp-mini--header rtp-mini--split">
        <div className="rtp-mini__logo" style={{ background: accent, width: layoutId === "wide-logo" ? 18 : 14, height: layoutId === "wide-logo" ? 18 : 14 }} />
        <div className="rtp-mini__stack">
          <div className="rtp-mini__bar" style={{ background: accent }} />
          <div className="rtp-mini__line" />
          <div className="rtp-mini__line rtp-mini__line--short" />
        </div>
      </div>
    );
  }
  if (layoutId === "minimal") {
    return (
      <div className="rtp-mini rtp-mini--header">
        <div className="rtp-mini__logo rtp-mini__logo--sm" style={{ background: accent }} />
        <div className="rtp-mini__stack">
          <div className="rtp-mini__bar rtp-mini__bar--thin" style={{ background: accent }} />
          <div className="rtp-mini__line rtp-mini__line--thin" />
        </div>
      </div>
    );
  }
  if (layoutId === "bordered" || layoutId === "accent-left") {
    return (
      <div className="rtp-mini rtp-mini--header" style={{ border: layoutId === "bordered" ? `1px solid ${accent}` : "none", borderLeft: layoutId === "accent-left" ? `3px solid ${accent}` : undefined, padding: 4 }}>
        <div className="rtp-mini__logo" style={{ background: accent }} />
        <div className="rtp-mini__bar" style={{ background: accent, flex: 1 }} />
      </div>
    );
  }
  return (
    <div className="rtp-mini rtp-mini--header">
      <div className="rtp-mini__logo" style={{ background: accent }} />
      <div className="rtp-mini__bar" style={{ background: accent, flex: 1 }} />
      <div className="rtp-mini__pill" style={{ borderColor: accent }} />
    </div>
  );
}

function StudentLayoutPreview({ layoutId, color }) {
  const accent = color || DEFAULT_SECTION_COLOR;
  if (layoutId === "photo-top" || layoutId === "two-column") {
    return (
      <div className="rtp-mini rtp-mini--student rtp-mini--col">
        {layoutId !== "two-column" && <div className="rtp-mini__photo" style={{ borderColor: accent }} />}
        <div className={`rtp-mini__grid ${layoutId === "two-column" ? "rtp-mini__grid--2" : "rtp-mini__grid--2"}`} />
      </div>
    );
  }
  if (layoutId === "grid") {
    return (
      <div className="rtp-mini rtp-mini--student">
        <div className="rtp-mini__grid rtp-mini__grid--3" />
      </div>
    );
  }
  if (layoutId === "inline" || layoutId === "compact-row") {
    return (
      <div className="rtp-mini rtp-mini--student rtp-mini--inline">
        <div className="rtp-mini__line" style={{ background: accent }} />
        <div className="rtp-mini__vdiv" />
        <div className="rtp-mini__line" style={{ background: accent }} />
        <div className="rtp-mini__vdiv" />
        <div className="rtp-mini__line" style={{ background: accent }} />
      </div>
    );
  }
  if (layoutId === "card" || layoutId === "bordered" || layoutId === "highlight") {
    return (
      <div className="rtp-mini rtp-mini--student" style={{ border: layoutId === "card" ? `1px solid ${accent}33` : layoutId === "bordered" ? `1px solid ${accent}` : "none", borderLeft: layoutId === "highlight" ? `3px solid ${accent}` : undefined, borderRadius: layoutId === "card" ? 6 : 0, padding: 4 }}>
        <div className="rtp-mini__photo" style={{ borderColor: accent }} />
        <div className="rtp-mini__grid rtp-mini__grid--2" />
      </div>
    );
  }
  return (
    <div className="rtp-mini rtp-mini--student">
      <div className="rtp-mini__photo" style={{ borderColor: accent }} />
      <div className="rtp-mini__grid rtp-mini__grid--2" />
    </div>
  );
}

function RemarksLayoutPreview({ layoutId, color }) {
  const accent = color || DEFAULT_SECTION_COLOR;
  if (layoutId === "stacked") {
    return (
      <div className="rtp-mini rtp-mini--remarks rtp-mini--col">
        <div className="rtp-mini__remark-block" style={{ borderColor: accent }} />
        <div className="rtp-mini__remark-block" style={{ borderColor: accent }} />
      </div>
    );
  }
  if (layoutId === "boxed" || layoutId === "cards") {
    return (
      <div className="rtp-mini rtp-mini--remarks">
        <div className="rtp-mini__remark-box" style={{ borderColor: accent, borderRadius: layoutId === "cards" ? 6 : 3 }} />
        <div className="rtp-mini__remark-box" style={{ borderColor: accent, borderRadius: layoutId === "cards" ? 6 : 3 }} />
      </div>
    );
  }
  if (layoutId === "signature" || layoutId === "formal") {
    return (
      <div className="rtp-mini rtp-mini--remarks">
        <div className="rtp-mini__remark-sig" style={{ borderBottomColor: accent }} />
        <div className="rtp-mini__remark-sig" style={{ borderBottomColor: accent }} />
      </div>
    );
  }
  if (layoutId === "accent-bar") {
    return (
      <div className="rtp-mini rtp-mini--remarks">
        <div className="rtp-mini__remark-accent" style={{ borderLeftColor: accent }} />
        <div className="rtp-mini__remark-accent" style={{ borderLeftColor: accent }} />
      </div>
    );
  }
  if (layoutId === "bordered") {
    return (
      <div className="rtp-mini rtp-mini--remarks" style={{ border: `1px solid ${accent}`, padding: 4, borderRadius: 3 }}>
        <div className="rtp-mini__remark-block" style={{ borderColor: accent }} />
        <div className="rtp-mini__remark-block" style={{ borderColor: accent }} />
      </div>
    );
  }
  if (layoutId === "minimal") {
    return (
      <div className="rtp-mini rtp-mini--remarks">
        <div className="rtp-mini__remark-min" style={{ background: accent }} />
        <div className="rtp-mini__remark-min" style={{ background: accent }} />
      </div>
    );
  }
  return (
    <div className="rtp-mini rtp-mini--remarks">
      <div className="rtp-mini__remark-block" style={{ borderColor: accent }} />
      <div className="rtp-mini__remark-block" style={{ borderColor: accent }} />
    </div>
  );
}

function LayoutPreview({ section, layout, color }) {
  if (layout.tableTemplate) {
    return <MiniTablePreview template={layout.tableTemplate} />;
  }
  if (section.type === "school-header") {
    return <HeaderLayoutPreview layoutId={layout.id} color={color} />;
  }
  if (section.type === "student-info") {
    return <StudentLayoutPreview layoutId={layout.id} color={color} />;
  }
  if (section.type === "remarks") {
    return <RemarksLayoutPreview layoutId={layout.id} color={color} />;
  }
  return <div className="rtp-mini rtp-mini--blank" />;
}

export default function ReportTemplateTab({ selectedElement, html, onHtmlChange }) {
  const section = useMemo(
    () => detectReportSection(html, selectedElement?.selector),
    [html, selectedElement?.selector]
  );

  if (!section) {
    return (
      <div className="rtp-empty">
        <p className="rtp-empty__title">No report section selected</p>
        <p className="rtp-empty__desc">
          Select a report card section in the preview — school header, student info, academic scores, behavioral traits, grading scale, or remarks.
        </p>
      </div>
    );
  }

  const layouts = getSectionLayouts(section);
  const activeLayout = section.layoutId;
  const activeColor = section.color || DEFAULT_SECTION_COLOR;
  const activeBg = section.backgroundColor ?? SECTION_BG_AUTO;
  const isBgAuto = activeBg === SECTION_BG_AUTO;

  const handleLayout = (layoutId) => {
    let next = applyReportSectionLayout(html, section, layoutId);
    const themed = { ...section, layoutId };
    next = applyReportSectionColor(next, themed, activeColor);
    next = applyReportSectionBackground(next, themed, activeBg, activeColor);
    onHtmlChange(next);
  };

  const handleColor = (color) => {
    let next = applyReportSectionColor(html, section, color);
    next = applyReportSectionBackground(next, section, activeBg, color);
    onHtmlChange(next);
  };

  const handleBackground = (backgroundColor) => {
    onHtmlChange(applyReportSectionBackground(html, section, backgroundColor, activeColor));
  };

  const handleReset = () => {
    if (!window.confirm(`Reset "${section.label}" to the default layout and color?`)) return;
    onHtmlChange(resetReportSection(html, section));
  };

  return (
    <div className="rtp-tab">
      <div className="rtp-tab__top">
        <div className="rtp-section-badge">{section.label}</div>
        <button type="button" className="rtp-reset-btn" onClick={handleReset}>
          Reset section
        </button>
      </div>

      <div className="rtp-block">
        <div className="rtp-block__head">
          <span className="rtp-block__title">Layout</span>
          <span className="rtp-block__hint">Choose how this section is arranged</span>
        </div>
        <div className="mrp-table-themes__grid rtp-layout-grid">
          {layouts.map((layout) => (
            <button
              key={layout.id}
              type="button"
              className={`mrp-table-theme rtp-layout-card ${activeLayout === layout.id ? "mrp-table-theme--active" : ""}`}
              onClick={() => handleLayout(layout.id)}
              title={layout.description}
            >
              <LayoutPreview section={section} layout={layout} color={activeColor} />
              <span className="mrp-table-theme__label">{layout.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rtp-block">
        <div className="rtp-block__head">
          <span className="rtp-block__title">Accent color</span>
          <span className="rtp-block__hint">Headers, borders, text highlights, and table theme</span>
        </div>
        <div className="rtp-colors">
          {SECTION_COLOR_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              className={`rtp-color-swatch ${activeColor === c ? "rtp-color-swatch--active" : ""}`}
              style={{ background: c }}
              onClick={() => handleColor(c)}
              title={c}
              aria-label={`Use accent color ${c}`}
            />
          ))}
          <label className="rtp-color-custom" title="Custom accent color">
            <input
              type="color"
              value={activeColor}
              onChange={(e) => handleColor(e.target.value)}
            />
            <span>Custom</span>
          </label>
        </div>
      </div>

      <div className="rtp-block">
        <div className="rtp-block__head">
          <span className="rtp-block__title">Background color</span>
          <span className="rtp-block__hint">Section fill. Auto follows layout and accent tint.</span>
        </div>
        <div className="rtp-colors">
          {SECTION_BG_PRESETS.map((preset) => {
            const isActive = preset.value === SECTION_BG_AUTO ? isBgAuto : activeBg === preset.value;
            return (
              <button
                key={preset.id}
                type="button"
                className={`rtp-color-swatch ${isActive ? "rtp-color-swatch--active" : ""} ${preset.id === "auto" ? "rtp-color-swatch--auto" : ""} ${preset.id === "transparent" ? "rtp-color-swatch--transparent" : ""}`}
                style={
                  preset.value && preset.value !== SECTION_BG_AUTO && preset.value !== "transparent"
                    ? { background: preset.value }
                    : undefined
                }
                onClick={() => handleBackground(preset.value)}
                title={preset.label}
                aria-label={`Use background ${preset.label}`}
              />
            );
          })}
          <label className="rtp-color-custom" title="Custom background color">
            <input
              type="color"
              value={isBgAuto || activeBg === "transparent" ? "#ffffff" : activeBg}
              onChange={(e) => handleBackground(e.target.value)}
            />
            <span>Custom</span>
          </label>
        </div>
      </div>

      {section.tableId && (
        <p className="rtp-footnote">
          Table layouts use the same presets as the Style tab. Pick a layout here, then fine-tune in Style if needed.
        </p>
      )}
    </div>
  );
}
