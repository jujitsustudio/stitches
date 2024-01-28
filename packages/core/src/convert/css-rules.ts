import Stitches from '../../types/stitches';
import { toCamelCase } from './camel-case';
import { toHyphenCase } from './hyphen-case';
import { toPolyfilledValue } from './polyfilled-value';
import { toResolvedMediaQueryRanges } from './resoled-media-query-ranges';
import { toResolvedSelectors } from './resolved-selectors';
import { toSizingValue } from './sizing-value';
import { toTailDashed } from './tail-dashed';
import { toTokenizedValue } from './tokenized-value';

/** Comma matcher outside rounded brackets. */
const comma = /\s*,\s*(?![^()]*\))/;

/** Default toString method of Objects. */
const toStringOfObject = Object.prototype.toString;

type Style = Record<any, any>;

export const toCssRules = (
  style: Style,
  selectors: string[],
  conditions: string[],
  config: Stitches<any, any, any, any, any>['config'],
  onCssText: (cssText: string) => void,
) => {
  /** CSSOM-compatible rule being created. */
  let currentRule: [string[], string[], string[]] | undefined;

  /** Last utility that was used, cached to prevent recursion. */
  let lastUtil: any;

  /** Last polyfill that was used, cached to prevent recursion. */
  let lastPoly: ((data: string) => Record<string, unknown>) | undefined;

  /** Walks CSS styles and converts them into CSSOM-compatible rules. */
  const walk = (
    style: Style,
    /** Selectors that define the elements to which a set of CSS styles apply. */ selectors: string[],
    /** Conditions that define the queries to which a set of CSS styles apply. */ conditions: string[],
  ) => {
    /** Represents the left-side "name" for the property (the at-rule prelude, style-rule selector, or declaration name). */
    let name: keyof typeof style;

    /** Represents the right-side "data" for the property (the rule block, or declaration value). */
    let data: (typeof style)[keyof typeof style];

    const each = (style: Style) => {
      for (name in style) {
        /** Whether the current name represents an at-rule. */
        const isAtRuleLike = name.charCodeAt(0) === 64;

        const datas =
          isAtRuleLike && Array.isArray(style[name])
            ? style[name]
            : [style[name]];

        for (data of datas) {
          const camelName = toCamelCase(name);

          /** Whether the current data represents a nesting rule, which is a plain object whose key is not already a util. */
          const isRuleLike =
            typeof data === 'object' &&
            data &&
            data.toString === toStringOfObject &&
            (!config.utils[camelName] || !selectors.length);

          // if the left-hand "name" matches a configured utility
          // conditionally transform the current data using the configured utility
          if (camelName in config.utils && !isRuleLike) {
            const util = config.utils[camelName];

            if (util !== lastUtil) {
              lastUtil = util;

              each(util(data));

              lastUtil = null;

              continue;
            }
          }
          // otherwise, if the left-hand "name" matches a configured polyfill
          // conditionally transform the current data using the polyfill
          else if (camelName in toPolyfilledValue) {
            const poly = toPolyfilledValue[camelName];

            if (poly !== lastPoly && typeof poly === 'function') {
              lastPoly = poly;

              each(poly(data));

              lastPoly = undefined;

              continue;
            }
          }

          // if the left-hand "name" matches a configured at-rule
          if (isAtRuleLike) {
            // transform the current name with the configured media at-rule prelude
            name = toResolvedMediaQueryRanges(
              name.slice(1) in config.media
                ? `@media ${config.media[name.slice(1)]}`
                : name,
            );
          }

          if (isRuleLike) {
            /** Next conditions, which may include one new condition (if this is an at-rule). */
            const nextConditions = isAtRuleLike
              ? conditions.concat(name)
              : [...conditions];

            /** Next selectors, which may include one new selector (if this is not an at-rule). */
            const nextSelections = isAtRuleLike
              ? [...selectors]
              : toResolvedSelectors(selectors, name.split(comma));

            if (currentRule !== undefined) {
              onCssText(toCssString(...currentRule));
            }

            currentRule = undefined;

            walk(data, nextSelections, nextConditions);
          } else {
            if (currentRule === undefined)
              currentRule = [[], selectors, conditions];

            /** CSS left-hand side value, which may be a specially-formatted custom property. */
            name =
              !isAtRuleLike && name.charCodeAt(0) === 36
                ? `--${toTailDashed(config.prefix)}${name
                    .slice(1)
                    .replace(/\$/g, '-')}`
                : name;

            /** CSS right-hand side value, which may be a specially-formatted custom property. */
            data =
              // preserve object-like data
              isRuleLike
                ? data
                : // replace all non-unitless props that are not custom properties with pixel versions
                  typeof data === 'number'
                  ? data &&
                    !(camelName in unitlessProps) &&
                    !(name.charCodeAt(0) === 45)
                    ? `${String(data)}px`
                    : String(data)
                  : // replace tokens with stringified primitive values
                    toTokenizedValue(
                      toSizingValue(camelName, data == null ? '' : data),
                      config.prefix,
                      config.themeMap[camelName],
                    );

            currentRule[0].push(
              `${isAtRuleLike ? `${name} ` : `${toHyphenCase(name)}:`}${data}`,
            );
          }
        }
      }
    };

    each(style);

    if (currentRule !== undefined) {
      onCssText(toCssString(...currentRule));
    }
    currentRule = undefined;
  };

  walk(style, selectors, conditions);
};

const toCssString = (
  declarations: string[],
  selectors: string[],
  conditions: string[],
) =>
  `${conditions.map((condition) => `${condition}{`).join('')}${
    selectors.length ? `${selectors.join(',')}{` : ''
  }${declarations.join(';')}${selectors.length ? '}' : ''}${Array(
    conditions.length ? conditions.length + 1 : 0,
  ).join('}')}`;

/** CSS Properties whose number values should be unitless. */
export const unitlessProps = {
  animationIterationCount: 1,
  aspectRatio: 1,
  borderImageOutset: 1,
  borderImageSlice: 1,
  borderImageWidth: 1,
  boxFlex: 1,
  boxFlexGroup: 1,
  boxOrdinalGroup: 1,
  columnCount: 1,
  columns: 1,
  flex: 1,
  flexGrow: 1,
  flexPositive: 1,
  flexShrink: 1,
  flexNegative: 1,
  flexOrder: 1,
  gridRow: 1,
  gridRowEnd: 1,
  gridRowSpan: 1,
  gridRowStart: 1,
  gridColumn: 1,
  gridColumnEnd: 1,
  gridColumnSpan: 1,
  gridColumnStart: 1,
  msGridRow: 1,
  msGridRowSpan: 1,
  msGridColumn: 1,
  msGridColumnSpan: 1,
  fontWeight: 1,
  lineClamp: 1,
  lineHeight: 1,
  opacity: 1,
  order: 1,
  orphans: 1,
  scale: 1,
  tabSize: 1,
  widows: 1,
  zIndex: 1,
  zoom: 1,
  WebkitLineClamp: 1,

  // SVG-related properties
  fillOpacity: 1,
  floodOpacity: 1,
  stopOpacity: 1,
  strokeDasharray: 1,
  strokeDashoffset: 1,
  strokeMiterlimit: 1,
  strokeOpacity: 1,
  strokeWidth: 1,
};
