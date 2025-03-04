/*!
 * vue-virtual-scroll-list v1.5.7
 * open source under the MIT license
 * https://github.com/uct8086/vue-virtual-list#readme
 */

import { ref, watch, onBeforeUnmount, defineComponent, h, createVNode, computed, onActivated, onDeactivated, onMounted } from 'vue';

function _arrayLikeToArray(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}
function _arrayWithoutHoles(r) {
  if (Array.isArray(r)) return _arrayLikeToArray(r);
}
function _classCallCheck(a, n) {
  if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
}
function _defineProperties(e, r) {
  for (var t = 0; t < r.length; t++) {
    var o = r[t];
    o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o);
  }
}
function _createClass(e, r, t) {
  return r && _defineProperties(e.prototype, r), Object.defineProperty(e, "prototype", {
    writable: !1
  }), e;
}
function _defineProperty(e, r, t) {
  return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
    value: t,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[r] = t, e;
}
function _iterableToArray(r) {
  if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
}
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function (r) {
      return Object.getOwnPropertyDescriptor(e, r).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread2(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {
      _defineProperty(e, r, t[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
    });
  }
  return e;
}
function _toConsumableArray(r) {
  return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread();
}
function _toPrimitive(t, r) {
  if ("object" != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != typeof i) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, "string");
  return "symbol" == typeof i ? i : i + "";
}
function _unsupportedIterableToArray(r, a) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
  }
}

/**
 * virtual list core calculating center
 */

var DIRECTION_TYPE = {
  FRONT: 'FRONT',
  // scroll up or left
  BEHIND: 'BEHIND' // scroll down or right
};
var CALC_TYPE = {
  INIT: 'INIT',
  FIXED: 'FIXED',
  DYNAMIC: 'DYNAMIC'
};
var LEADING_BUFFER = 0;
var Virtual = /*#__PURE__*/function () {
  function Virtual(param, callUpdate) {
    _classCallCheck(this, Virtual);
    this.init(param, callUpdate);
  }
  return _createClass(Virtual, [{
    key: "init",
    value: function init() {
      var param = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var callUpdate = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      this.param = param;
      this.callUpdate = callUpdate;
      // size data
      this.sizes = new Map();
      this.firstRangeTotalSize = 0;
      this.firstRangeAverageSize = 0;
      this.lastCalcIndex = 0;
      this.fixedSizeValue = 0;
      this.calcType = CALC_TYPE.INIT;

      // scroll data
      this.offset = 0;
      this.direction = '';

      // range data
      this.range = Object.create(null);
      if (this.param) {
        this.checkRange(0, this.param.keeps - 1);
      }
    }
  }, {
    key: "destroy",
    value: function destroy() {
      this.init();
    }

    // return current render range
  }, {
    key: "getRange",
    value: function getRange() {
      var range = Object.create(null);
      range.start = this.range.start;
      range.end = this.range.end;
      range.padFront = this.range.padFront;
      range.padBehind = this.range.padBehind;
      return range;
    }
  }, {
    key: "isBehind",
    value: function isBehind() {
      return this.direction === DIRECTION_TYPE.BEHIND;
    }
  }, {
    key: "isFront",
    value: function isFront() {
      return this.direction === DIRECTION_TYPE.FRONT;
    }

    // return start index offset
  }, {
    key: "getOffset",
    value: function getOffset(start) {
      return (start < 1 ? 0 : this.getIndexOffset(start)) + this.param.slotHeaderSize;
    }
  }, {
    key: "updateParam",
    value: function updateParam(key, value) {
      var _this = this;
      if (this.param && Object.keys(this.param).includes(key)) {
        // if uniqueIds change, find out deleted id and remove from size map
        if (key === 'uniqueIds') {
          this.sizes.forEach(function (v, k) {
            if (!value.includes(k)) {
              _this.sizes["delete"](k);
            }
          });
        }
        this.param[key] = value;
      }
    }

    // save each size map by id
  }, {
    key: "saveSize",
    value: function saveSize(id, size) {
      this.sizes.set(id, size);
      // we assume size type is fixed at the beginning and remember first size value
      // if there is no size value different from this at next comming saving
      // we think it's a fixed size list, otherwise is dynamic size list
      if (this.calcType === CALC_TYPE.INIT) {
        this.fixedSizeValue = size;
        this.calcType = CALC_TYPE.FIXED;
      } else if (this.calcType === CALC_TYPE.FIXED && this.fixedSizeValue !== size) {
        this.calcType = CALC_TYPE.DYNAMIC;
        // it's no use at all
        delete this.fixedSizeValue;
      }

      // calculate the average size only in the first range
      if (this.calcType !== CALC_TYPE.FIXED && typeof this.firstRangeTotalSize !== 'undefined') {
        if (this.sizes.size < Math.min(this.param.keeps, this.param.uniqueIds.length)) {
          this.firstRangeTotalSize = _toConsumableArray(this.sizes.values()).reduce(function (acc, val) {
            return acc + val;
          }, 0);
          this.firstRangeAverageSize = Math.round(this.firstRangeTotalSize / this.sizes.size);
        } else {
          // it's done using
          delete this.firstRangeTotalSize;
        }
      }
    }
  }, {
    key: "getTotalSize",
    value: function getTotalSize() {
      return _toConsumableArray(this.sizes.values()).reduce(function (acc, val) {
        return acc + val;
      }, 0);
    }

    // in some special situation (e.g. length change) we need to update in a row
    // try goiong to render next range by a leading buffer according to current direction
  }, {
    key: "handleDataSourcesChange",
    value: function handleDataSourcesChange() {
      var start = this.range.start;
      if (this.isFront()) {
        start = start - LEADING_BUFFER;
      } else if (this.isBehind()) {
        start = start + LEADING_BUFFER;
      }
      start = Math.max(start, 0);
      this.updateRange(this.range.start, this.getEndByStart(start));
    }

    // when slot size change, we also need force update
  }, {
    key: "handleSlotSizeChange",
    value: function handleSlotSizeChange() {
      this.handleDataSourcesChange();
    }

    // calculating range on scroll
  }, {
    key: "handleScroll",
    value: function handleScroll(offset) {
      this.direction = offset < this.offset ? DIRECTION_TYPE.FRONT : DIRECTION_TYPE.BEHIND;
      this.offset = offset;
      if (!this.param) {
        return;
      }
      if (this.direction === DIRECTION_TYPE.FRONT) {
        this.handleFront();
      } else if (this.direction === DIRECTION_TYPE.BEHIND) {
        this.handleBehind();
      }
    }
  }, {
    key: "handleFront",
    value: function handleFront() {
      var overs = this.getScrollOvers();
      // should not change range if start doesn't exceed overs
      if (overs > this.range.start) {
        return;
      }

      // move up start by a buffer length, and make sure its safety
      var start = Math.max(overs - this.param.buffer, 0);
      this.checkRange(start, this.getEndByStart(start));
    }
  }, {
    key: "handleBehind",
    value: function handleBehind() {
      var overs = this.getScrollOvers();
      // range should not change if scroll overs within buffer
      if (overs < this.range.start + this.param.buffer) {
        return;
      }
      this.checkRange(overs, this.getEndByStart(overs));
    }

    // return the pass overs according to current scroll offset
  }, {
    key: "getScrollOvers",
    value: function getScrollOvers() {
      // if slot header exist, we need subtract its size
      var offset = this.offset - this.param.slotHeaderSize;
      if (offset <= 0) {
        return 0;
      }
      // if is fixed type, that can be easily
      if (this.isFixedType()) {
        return Math.floor(offset / this.fixedSizeValue);
      }
      var low = 0;
      var middle = 0;
      var middleOffset = 0;
      var high = this.param.uniqueIds.length;
      while (low <= high) {
        // this.__bsearchCalls++
        middle = low + Math.floor((high - low) / 2);
        middleOffset = this.getIndexOffset(middle);
        if (middleOffset === offset) {
          return middle;
        }
        if (middleOffset < offset) {
          low = middle + 1;
        } else if (middleOffset > offset) {
          high = middle - 1;
        }
      }
      return low > 0 ? --low : 0;
    }

    // return a scroll offset from given index, can efficiency be improved more here?
    // although the call frequency is very high, its only a superposition of numbers
  }, {
    key: "getIndexOffset",
    value: function getIndexOffset(givenIndex) {
      if (!givenIndex) {
        return 0;
      }
      var offset = 0;
      var indexSize = 0;
      for (var index = 0; index < givenIndex; index++) {
        indexSize = this.sizes.get(this.param.uniqueIds[index]);
        offset = offset + (typeof indexSize === 'number' ? indexSize : this.getEstimateSize());
      }

      // remember last calculate index
      this.lastCalcIndex = Math.max(this.lastCalcIndex, givenIndex - 1);
      this.lastCalcIndex = Math.min(this.lastCalcIndex, this.getLastIndex());
      return offset;
    }

    // is fixed size type
  }, {
    key: "isFixedType",
    value: function isFixedType() {
      return this.calcType === CALC_TYPE.FIXED;
    }

    // return the real last index
  }, {
    key: "getLastIndex",
    value: function getLastIndex() {
      return this.param.uniqueIds.length - 1;
    }

    // in some conditions range is broke, we need correct it
    // and then decide whether need update to next range
  }, {
    key: "checkRange",
    value: function checkRange(start, end) {
      var keeps = this.param.keeps;
      var total = this.param.uniqueIds.length;
      // datas less than keeps, render all
      if (total <= keeps) {
        start = 0;
        end = this.getLastIndex();
      } else if (end - start < keeps - 1) {
        // if range length is less than keeps, corrent it base on end
        start = end - keeps + 1;
      }
      if (this.range.start !== start) {
        this.updateRange(start, end);
      }
    }

    // setting to a new range and rerender
  }, {
    key: "updateRange",
    value: function updateRange(start, end) {
      this.range.start = start;
      this.range.end = end;
      this.range.padFront = this.getPadFront();
      this.range.padBehind = this.getPadBehind();
      this.callUpdate(this.getRange());
    }

    // return end base on start
  }, {
    key: "getEndByStart",
    value: function getEndByStart(start) {
      var theoryEnd = start + this.param.keeps - 1;
      var truelyEnd = Math.min(theoryEnd, this.getLastIndex());
      return truelyEnd;
    }

    // return total front offset
  }, {
    key: "getPadFront",
    value: function getPadFront() {
      if (this.isFixedType()) {
        return this.fixedSizeValue * this.range.start;
      }
      return this.getIndexOffset(this.range.start);
    }

    // return total behind offset
  }, {
    key: "getPadBehind",
    value: function getPadBehind() {
      var end = this.range.end;
      var lastIndex = this.getLastIndex();
      if (this.isFixedType()) {
        return (lastIndex - end) * this.fixedSizeValue;
      }

      // if it's all calculated, return the exactly offset
      if (this.lastCalcIndex === lastIndex) {
        return this.getIndexOffset(lastIndex) - this.getIndexOffset(end);
      }
      // if not, use a estimated value
      return (lastIndex - end) * this.getEstimateSize();
    }

    // get the item estimate size
  }, {
    key: "getEstimateSize",
    value: function getEstimateSize() {
      return this.isFixedType() ? this.fixedSizeValue : this.firstRangeAverageSize || this.param.estimateSize;
    }
  }]);
}();

var resizeObservers = [];

var hasActiveObservations = function () {
    return resizeObservers.some(function (ro) { return ro.activeTargets.length > 0; });
};

var hasSkippedObservations = function () {
    return resizeObservers.some(function (ro) { return ro.skippedTargets.length > 0; });
};

var msg = 'ResizeObserver loop completed with undelivered notifications.';
var deliverResizeLoopError = function () {
    var event;
    if (typeof ErrorEvent === 'function') {
        event = new ErrorEvent('error', {
            message: msg
        });
    }
    else {
        event = document.createEvent('Event');
        event.initEvent('error', false, false);
        event.message = msg;
    }
    window.dispatchEvent(event);
};

var ResizeObserverBoxOptions;
(function (ResizeObserverBoxOptions) {
    ResizeObserverBoxOptions["BORDER_BOX"] = "border-box";
    ResizeObserverBoxOptions["CONTENT_BOX"] = "content-box";
    ResizeObserverBoxOptions["DEVICE_PIXEL_CONTENT_BOX"] = "device-pixel-content-box";
})(ResizeObserverBoxOptions || (ResizeObserverBoxOptions = {}));

var freeze = function (obj) { return Object.freeze(obj); };

var ResizeObserverSize = (function () {
    function ResizeObserverSize(inlineSize, blockSize) {
        this.inlineSize = inlineSize;
        this.blockSize = blockSize;
        freeze(this);
    }
    return ResizeObserverSize;
}());

var DOMRectReadOnly = (function () {
    function DOMRectReadOnly(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.top = this.y;
        this.left = this.x;
        this.bottom = this.top + this.height;
        this.right = this.left + this.width;
        return freeze(this);
    }
    DOMRectReadOnly.prototype.toJSON = function () {
        var _a = this, x = _a.x, y = _a.y, top = _a.top, right = _a.right, bottom = _a.bottom, left = _a.left, width = _a.width, height = _a.height;
        return { x: x, y: y, top: top, right: right, bottom: bottom, left: left, width: width, height: height };
    };
    DOMRectReadOnly.fromRect = function (rectangle) {
        return new DOMRectReadOnly(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
    };
    return DOMRectReadOnly;
}());

var isSVG = function (target) { return target instanceof SVGElement && 'getBBox' in target; };
var isHidden = function (target) {
    if (isSVG(target)) {
        var _a = target.getBBox(), width = _a.width, height = _a.height;
        return !width && !height;
    }
    var _b = target, offsetWidth = _b.offsetWidth, offsetHeight = _b.offsetHeight;
    return !(offsetWidth || offsetHeight || target.getClientRects().length);
};
var isElement = function (obj) {
    var _a;
    if (obj instanceof Element) {
        return true;
    }
    var scope = (_a = obj === null || obj === void 0 ? void 0 : obj.ownerDocument) === null || _a === void 0 ? void 0 : _a.defaultView;
    return !!(scope && obj instanceof scope.Element);
};
var isReplacedElement = function (target) {
    switch (target.tagName) {
        case 'INPUT':
            if (target.type !== 'image') {
                break;
            }
        case 'VIDEO':
        case 'AUDIO':
        case 'EMBED':
        case 'OBJECT':
        case 'CANVAS':
        case 'IFRAME':
        case 'IMG':
            return true;
    }
    return false;
};

var global = typeof window !== 'undefined' ? window : {};

var cache = new WeakMap();
var scrollRegexp = /auto|scroll/;
var verticalRegexp = /^tb|vertical/;
var IE = (/msie|trident/i).test(global.navigator && global.navigator.userAgent);
var parseDimension = function (pixel) { return parseFloat(pixel || '0'); };
var size = function (inlineSize, blockSize, switchSizes) {
    if (inlineSize === void 0) { inlineSize = 0; }
    if (blockSize === void 0) { blockSize = 0; }
    if (switchSizes === void 0) { switchSizes = false; }
    return new ResizeObserverSize((switchSizes ? blockSize : inlineSize) || 0, (switchSizes ? inlineSize : blockSize) || 0);
};
var zeroBoxes = freeze({
    devicePixelContentBoxSize: size(),
    borderBoxSize: size(),
    contentBoxSize: size(),
    contentRect: new DOMRectReadOnly(0, 0, 0, 0)
});
var calculateBoxSizes = function (target, forceRecalculation) {
    if (forceRecalculation === void 0) { forceRecalculation = false; }
    if (cache.has(target) && !forceRecalculation) {
        return cache.get(target);
    }
    if (isHidden(target)) {
        cache.set(target, zeroBoxes);
        return zeroBoxes;
    }
    var cs = getComputedStyle(target);
    var svg = isSVG(target) && target.ownerSVGElement && target.getBBox();
    var removePadding = !IE && cs.boxSizing === 'border-box';
    var switchSizes = verticalRegexp.test(cs.writingMode || '');
    var canScrollVertically = !svg && scrollRegexp.test(cs.overflowY || '');
    var canScrollHorizontally = !svg && scrollRegexp.test(cs.overflowX || '');
    var paddingTop = svg ? 0 : parseDimension(cs.paddingTop);
    var paddingRight = svg ? 0 : parseDimension(cs.paddingRight);
    var paddingBottom = svg ? 0 : parseDimension(cs.paddingBottom);
    var paddingLeft = svg ? 0 : parseDimension(cs.paddingLeft);
    var borderTop = svg ? 0 : parseDimension(cs.borderTopWidth);
    var borderRight = svg ? 0 : parseDimension(cs.borderRightWidth);
    var borderBottom = svg ? 0 : parseDimension(cs.borderBottomWidth);
    var borderLeft = svg ? 0 : parseDimension(cs.borderLeftWidth);
    var horizontalPadding = paddingLeft + paddingRight;
    var verticalPadding = paddingTop + paddingBottom;
    var horizontalBorderArea = borderLeft + borderRight;
    var verticalBorderArea = borderTop + borderBottom;
    var horizontalScrollbarThickness = !canScrollHorizontally ? 0 : target.offsetHeight - verticalBorderArea - target.clientHeight;
    var verticalScrollbarThickness = !canScrollVertically ? 0 : target.offsetWidth - horizontalBorderArea - target.clientWidth;
    var widthReduction = removePadding ? horizontalPadding + horizontalBorderArea : 0;
    var heightReduction = removePadding ? verticalPadding + verticalBorderArea : 0;
    var contentWidth = svg ? svg.width : parseDimension(cs.width) - widthReduction - verticalScrollbarThickness;
    var contentHeight = svg ? svg.height : parseDimension(cs.height) - heightReduction - horizontalScrollbarThickness;
    var borderBoxWidth = contentWidth + horizontalPadding + verticalScrollbarThickness + horizontalBorderArea;
    var borderBoxHeight = contentHeight + verticalPadding + horizontalScrollbarThickness + verticalBorderArea;
    var boxes = freeze({
        devicePixelContentBoxSize: size(Math.round(contentWidth * devicePixelRatio), Math.round(contentHeight * devicePixelRatio), switchSizes),
        borderBoxSize: size(borderBoxWidth, borderBoxHeight, switchSizes),
        contentBoxSize: size(contentWidth, contentHeight, switchSizes),
        contentRect: new DOMRectReadOnly(paddingLeft, paddingTop, contentWidth, contentHeight)
    });
    cache.set(target, boxes);
    return boxes;
};
var calculateBoxSize = function (target, observedBox, forceRecalculation) {
    var _a = calculateBoxSizes(target, forceRecalculation), borderBoxSize = _a.borderBoxSize, contentBoxSize = _a.contentBoxSize, devicePixelContentBoxSize = _a.devicePixelContentBoxSize;
    switch (observedBox) {
        case ResizeObserverBoxOptions.DEVICE_PIXEL_CONTENT_BOX:
            return devicePixelContentBoxSize;
        case ResizeObserverBoxOptions.BORDER_BOX:
            return borderBoxSize;
        default:
            return contentBoxSize;
    }
};

var ResizeObserverEntry = (function () {
    function ResizeObserverEntry(target) {
        var boxes = calculateBoxSizes(target);
        this.target = target;
        this.contentRect = boxes.contentRect;
        this.borderBoxSize = freeze([boxes.borderBoxSize]);
        this.contentBoxSize = freeze([boxes.contentBoxSize]);
        this.devicePixelContentBoxSize = freeze([boxes.devicePixelContentBoxSize]);
    }
    return ResizeObserverEntry;
}());

var calculateDepthForNode = function (node) {
    if (isHidden(node)) {
        return Infinity;
    }
    var depth = 0;
    var parent = node.parentNode;
    while (parent) {
        depth += 1;
        parent = parent.parentNode;
    }
    return depth;
};

var broadcastActiveObservations = function () {
    var shallowestDepth = Infinity;
    var callbacks = [];
    resizeObservers.forEach(function processObserver(ro) {
        if (ro.activeTargets.length === 0) {
            return;
        }
        var entries = [];
        ro.activeTargets.forEach(function processTarget(ot) {
            var entry = new ResizeObserverEntry(ot.target);
            var targetDepth = calculateDepthForNode(ot.target);
            entries.push(entry);
            ot.lastReportedSize = calculateBoxSize(ot.target, ot.observedBox);
            if (targetDepth < shallowestDepth) {
                shallowestDepth = targetDepth;
            }
        });
        callbacks.push(function resizeObserverCallback() {
            ro.callback.call(ro.observer, entries, ro.observer);
        });
        ro.activeTargets.splice(0, ro.activeTargets.length);
    });
    for (var _i = 0, callbacks_1 = callbacks; _i < callbacks_1.length; _i++) {
        var callback = callbacks_1[_i];
        callback();
    }
    return shallowestDepth;
};

var gatherActiveObservationsAtDepth = function (depth) {
    resizeObservers.forEach(function processObserver(ro) {
        ro.activeTargets.splice(0, ro.activeTargets.length);
        ro.skippedTargets.splice(0, ro.skippedTargets.length);
        ro.observationTargets.forEach(function processTarget(ot) {
            if (ot.isActive()) {
                if (calculateDepthForNode(ot.target) > depth) {
                    ro.activeTargets.push(ot);
                }
                else {
                    ro.skippedTargets.push(ot);
                }
            }
        });
    });
};

var process = function () {
    var depth = 0;
    gatherActiveObservationsAtDepth(depth);
    while (hasActiveObservations()) {
        depth = broadcastActiveObservations();
        gatherActiveObservationsAtDepth(depth);
    }
    if (hasSkippedObservations()) {
        deliverResizeLoopError();
    }
    return depth > 0;
};

var trigger;
var callbacks = [];
var notify = function () { return callbacks.splice(0).forEach(function (cb) { return cb(); }); };
var queueMicroTask = function (callback) {
    if (!trigger) {
        var toggle_1 = 0;
        var el_1 = document.createTextNode('');
        var config = { characterData: true };
        new MutationObserver(function () { return notify(); }).observe(el_1, config);
        trigger = function () { el_1.textContent = "".concat(toggle_1 ? toggle_1-- : toggle_1++); };
    }
    callbacks.push(callback);
    trigger();
};

var queueResizeObserver = function (cb) {
    queueMicroTask(function ResizeObserver() {
        requestAnimationFrame(cb);
    });
};

var watching = 0;
var isWatching = function () { return !!watching; };
var CATCH_PERIOD = 250;
var observerConfig = { attributes: true, characterData: true, childList: true, subtree: true };
var events = [
    'resize',
    'load',
    'transitionend',
    'animationend',
    'animationstart',
    'animationiteration',
    'keyup',
    'keydown',
    'mouseup',
    'mousedown',
    'mouseover',
    'mouseout',
    'blur',
    'focus'
];
var time = function (timeout) {
    if (timeout === void 0) { timeout = 0; }
    return Date.now() + timeout;
};
var scheduled = false;
var Scheduler = (function () {
    function Scheduler() {
        var _this = this;
        this.stopped = true;
        this.listener = function () { return _this.schedule(); };
    }
    Scheduler.prototype.run = function (timeout) {
        var _this = this;
        if (timeout === void 0) { timeout = CATCH_PERIOD; }
        if (scheduled) {
            return;
        }
        scheduled = true;
        var until = time(timeout);
        queueResizeObserver(function () {
            var elementsHaveResized = false;
            try {
                elementsHaveResized = process();
            }
            finally {
                scheduled = false;
                timeout = until - time();
                if (!isWatching()) {
                    return;
                }
                if (elementsHaveResized) {
                    _this.run(1000);
                }
                else if (timeout > 0) {
                    _this.run(timeout);
                }
                else {
                    _this.start();
                }
            }
        });
    };
    Scheduler.prototype.schedule = function () {
        this.stop();
        this.run();
    };
    Scheduler.prototype.observe = function () {
        var _this = this;
        var cb = function () { return _this.observer && _this.observer.observe(document.body, observerConfig); };
        document.body ? cb() : global.addEventListener('DOMContentLoaded', cb);
    };
    Scheduler.prototype.start = function () {
        var _this = this;
        if (this.stopped) {
            this.stopped = false;
            this.observer = new MutationObserver(this.listener);
            this.observe();
            events.forEach(function (name) { return global.addEventListener(name, _this.listener, true); });
        }
    };
    Scheduler.prototype.stop = function () {
        var _this = this;
        if (!this.stopped) {
            this.observer && this.observer.disconnect();
            events.forEach(function (name) { return global.removeEventListener(name, _this.listener, true); });
            this.stopped = true;
        }
    };
    return Scheduler;
}());
var scheduler = new Scheduler();
var updateCount = function (n) {
    !watching && n > 0 && scheduler.start();
    watching += n;
    !watching && scheduler.stop();
};

var skipNotifyOnElement = function (target) {
    return !isSVG(target)
        && !isReplacedElement(target)
        && getComputedStyle(target).display === 'inline';
};
var ResizeObservation = (function () {
    function ResizeObservation(target, observedBox) {
        this.target = target;
        this.observedBox = observedBox || ResizeObserverBoxOptions.CONTENT_BOX;
        this.lastReportedSize = {
            inlineSize: 0,
            blockSize: 0
        };
    }
    ResizeObservation.prototype.isActive = function () {
        var size = calculateBoxSize(this.target, this.observedBox, true);
        if (skipNotifyOnElement(this.target)) {
            this.lastReportedSize = size;
        }
        if (this.lastReportedSize.inlineSize !== size.inlineSize
            || this.lastReportedSize.blockSize !== size.blockSize) {
            return true;
        }
        return false;
    };
    return ResizeObservation;
}());

var ResizeObserverDetail = (function () {
    function ResizeObserverDetail(resizeObserver, callback) {
        this.activeTargets = [];
        this.skippedTargets = [];
        this.observationTargets = [];
        this.observer = resizeObserver;
        this.callback = callback;
    }
    return ResizeObserverDetail;
}());

var observerMap = new WeakMap();
var getObservationIndex = function (observationTargets, target) {
    for (var i = 0; i < observationTargets.length; i += 1) {
        if (observationTargets[i].target === target) {
            return i;
        }
    }
    return -1;
};
var ResizeObserverController = (function () {
    function ResizeObserverController() {
    }
    ResizeObserverController.connect = function (resizeObserver, callback) {
        var detail = new ResizeObserverDetail(resizeObserver, callback);
        observerMap.set(resizeObserver, detail);
    };
    ResizeObserverController.observe = function (resizeObserver, target, options) {
        var detail = observerMap.get(resizeObserver);
        var firstObservation = detail.observationTargets.length === 0;
        if (getObservationIndex(detail.observationTargets, target) < 0) {
            firstObservation && resizeObservers.push(detail);
            detail.observationTargets.push(new ResizeObservation(target, options && options.box));
            updateCount(1);
            scheduler.schedule();
        }
    };
    ResizeObserverController.unobserve = function (resizeObserver, target) {
        var detail = observerMap.get(resizeObserver);
        var index = getObservationIndex(detail.observationTargets, target);
        var lastObservation = detail.observationTargets.length === 1;
        if (index >= 0) {
            lastObservation && resizeObservers.splice(resizeObservers.indexOf(detail), 1);
            detail.observationTargets.splice(index, 1);
            updateCount(-1);
        }
    };
    ResizeObserverController.disconnect = function (resizeObserver) {
        var _this = this;
        var detail = observerMap.get(resizeObserver);
        detail.observationTargets.slice().forEach(function (ot) { return _this.unobserve(resizeObserver, ot.target); });
        detail.activeTargets.splice(0, detail.activeTargets.length);
    };
    return ResizeObserverController;
}());

var ResizeObserver = (function () {
    function ResizeObserver(callback) {
        if (arguments.length === 0) {
            throw new TypeError("Failed to construct 'ResizeObserver': 1 argument required, but only 0 present.");
        }
        if (typeof callback !== 'function') {
            throw new TypeError("Failed to construct 'ResizeObserver': The callback provided as parameter 1 is not a function.");
        }
        ResizeObserverController.connect(this, callback);
    }
    ResizeObserver.prototype.observe = function (target, options) {
        if (arguments.length === 0) {
            throw new TypeError("Failed to execute 'observe' on 'ResizeObserver': 1 argument required, but only 0 present.");
        }
        if (!isElement(target)) {
            throw new TypeError("Failed to execute 'observe' on 'ResizeObserver': parameter 1 is not of type 'Element");
        }
        ResizeObserverController.observe(this, target, options);
    };
    ResizeObserver.prototype.unobserve = function (target) {
        if (arguments.length === 0) {
            throw new TypeError("Failed to execute 'unobserve' on 'ResizeObserver': 1 argument required, but only 0 present.");
        }
        if (!isElement(target)) {
            throw new TypeError("Failed to execute 'unobserve' on 'ResizeObserver': parameter 1 is not of type 'Element");
        }
        ResizeObserverController.unobserve(this, target);
    };
    ResizeObserver.prototype.disconnect = function () {
        ResizeObserverController.disconnect(this);
    };
    ResizeObserver.toString = function () {
        return 'function ResizeObserver () { [polyfill code] }';
    };
    return ResizeObserver;
}());

var useResize = (function (triggerRef, callback, disabledRef) {
  var _disabledRef = ref(disabledRef);
  var handleResize = function handleResize() {
    if (_disabledRef.value) {
      return;
    }
    callback && callback();
  };
  var ro = new ResizeObserver(handleResize);
  watch(triggerRef, function ($trigger, $oldTrigger) {
    if ($oldTrigger) {
      ro.unobserve($oldTrigger);
    }
    if ($trigger) {
      ro.observe($trigger);
    }
  });
  onBeforeUnmount(function () {
    ro.disconnect();
  });
});

/**
 * props declaration for default, item and slot component
 */

var VirtualProps = {
  dataKey: {
    type: [String, Function],
    required: true
  },
  dataSources: {
    type: Array,
    required: true
  },
  keeps: {
    type: Number,
    "default": 30
  },
  extraProps: {
    type: Object
  },
  estimateSize: {
    type: Number,
    "default": 50
  },
  direction: {
    type: String,
    "default": 'vertical' // the other value is horizontal
  },
  start: {
    type: Number,
    "default": 0
  },
  offset: {
    type: Number,
    "default": 0
  },
  topThreshold: {
    type: Number,
    "default": 0
  },
  bottomThreshold: {
    type: Number,
    "default": 0
  },
  pageMode: {
    type: Boolean,
    "default": false
  },
  containerClass: {
    type: String,
    "default": ''
  },
  rootTag: {
    type: String,
    "default": 'div'
  },
  wrapTag: {
    type: String,
    "default": 'div'
  },
  wrapClass: {
    type: String,
    "default": ''
  },
  wrapStyle: {
    type: Object
  },
  itemTag: {
    type: String,
    "default": 'div'
  },
  itemClass: {
    type: String,
    "default": ''
  },
  itemClassAdd: {
    type: Function
  },
  itemStyle: {
    type: Object
  },
  headerTag: {
    type: String,
    "default": 'div'
  },
  headerClass: {
    type: String,
    "default": ''
  },
  headerStyle: {
    type: Object
  },
  footerTag: {
    type: String,
    "default": 'div'
  },
  footerClass: {
    type: String,
    "default": ''
  },
  footerStyle: {
    type: Object
  },
  itemScopedSlots: {
    type: Object
  }
};
var ItemProps = {
  index: {
    type: Number
  },
  event: {
    type: String
  },
  tag: {
    type: String
  },
  horizontal: {
    type: Boolean
  },
  source: {
    type: [Object, String, Number]
  },
  component: {
    type: [Object, Function]
  },
  slotComponent: {
    type: Function
  },
  uniqueKey: {
    type: [String, Number]
  },
  extraProps: {
    type: Object
  },
  scopedSlots: {
    type: Object
  }
};

// import useResize from '../_util/use/useResize';

// wrapping for item
var VirtualListItem = defineComponent({
  name: 'VirtualListItem',
  props: ItemProps,
  setup: function setup(props, _ref) {
    var attrs = _ref.attrs;
    var itemRef = ref();

    // tell parent current size identify by unqiue key
    var dispatchSizeChange = function dispatchSizeChange() {
      var shapeKey = props.horizontal ? 'offsetWidth' : 'offsetHeight';
      var s = itemRef.value ? itemRef.value[shapeKey] : 0;
      attrs.onItemResized(props.uniqueKey, s);
    };
    useResize(itemRef, dispatchSizeChange);
    return {
      itemRef: itemRef
    };
  },
  render: function render() {
    var _this = this;
    var tag = this.tag,
      _this$extraProps = this.extraProps,
      extraProps = _this$extraProps === void 0 ? {} : _this$extraProps,
      index = this.index,
      source = this.source,
      _this$scopedSlots = this.scopedSlots,
      scopedSlots = _this$scopedSlots === void 0 ? {} : _this$scopedSlots,
      uniqueKey = this.uniqueKey,
      slotComponent = this.slotComponent;
    var _props = _objectSpread2(_objectSpread2({}, extraProps), {}, {
      source: source,
      index: index
    });
    return h(tag, {
      key: uniqueKey,
      role: 'listItem',
      ref: function ref(el) {
        if (el) _this.itemRef = el;
      }
    }, [createVNode(slotComponent, {
      source: source,
      index: index,
      scope: _props,
      slots: scopedSlots
    })]);
  }
});

/**
 * virtual list default component
 * rewrite by uct8086
 */
/*global document:readonly, console:readonly*/
var TO_TOP_EVENT = 'totop';
var TO_BOTTOM_EVENT = 'tobottom';
var RESIZED_EVENT = 'resized';
var SLOT_TYPE = {
  HEADER: 'thead',
  // string value also use for aria role attribute
  FOOTER: 'tfoot'
};
var VirtualList = defineComponent({
  name: 'VirtualList',
  props: VirtualProps,
  emits: [TO_TOP_EVENT, TO_BOTTOM_EVENT, RESIZED_EVENT, 'scroll'],
  setup: function setup(props, _ref) {
    var emit = _ref.emit,
      slots = _ref.slots;
    var isHorizontal = props.direction === 'horizontal';
    var directionKey = isHorizontal ? 'scrollLeft' : 'scrollTop';
    var rootRef = ref();
    var shepherdRef = ref();
    var rangeRef = ref(Object.create(null));
    var virtual = null;
    var fullHeight = computed(function () {
      var padBehind = rangeRef.value.padBehind;
      if (padBehind !== 0) {
        return virtual && virtual.getEstimateSize() * props.dataSources.length;
      }
      return virtual.getTotalSize();
    });
    var getUniqueIdFromDataSources = function getUniqueIdFromDataSources() {
      var dataKey = props.dataKey;
      return props.dataSources.map(function (dataSource) {
        return typeof dataKey === 'function' ? dataKey(dataSource) : dataSource[dataKey];
      });
    };
    var installVirtual = function installVirtual() {
      virtual = new Virtual({
        slotHeaderSize: 0,
        slotFooterSize: 0,
        keeps: props.keeps,
        estimateSize: props.estimateSize,
        buffer: Math.round(props.keeps / 3),
        // recommend for a third of keeps
        uniqueIds: getUniqueIdFromDataSources()
      }, function (range) {
        rangeRef.value = range; // 这里更新Range
      });
      // sync initial range
      rangeRef.value = virtual.getRange();
    };
    installVirtual();

    // get item size by id
    var getSize = function getSize(id) {
      return virtual.sizes.get(id);
    };

    // get the total number of stored (rendered) items
    var getSizes = function getSizes() {
      return virtual.sizes.size;
    };

    // return current scroll offset
    var getOffset = function getOffset() {
      if (props.pageMode) {
        return document.documentElement[directionKey] || document.body[directionKey];
      } else {
        var root = rootRef.value;
        return root ? Math.ceil(root[directionKey]) : 0;
      }
    };

    // return client viewport size
    var getClientSize = function getClientSize() {
      var key = isHorizontal ? 'clientWidth' : 'clientHeight';
      if (props.pageMode) {
        return document.documentElement[key] || document.body[key];
      } else {
        var root = rootRef.value;
        return root ? Math.ceil(root[key]) : 0;
      }
    };

    // return all scroll size
    var getScrollSize = function getScrollSize() {
      var key = isHorizontal ? 'scrollWidth' : 'scrollHeight';
      if (props.pageMode) {
        return document.documentElement[key] || document.body[key];
      } else {
        var root = rootRef.value;
        return root ? Math.ceil(root[key]) : 0;
      }
    };

    // set current scroll position to a expectant offset
    var scrollToOffset = function scrollToOffset(offset) {
      if (props.pageMode) {
        document.body[directionKey] = offset;
        document.documentElement[directionKey] = offset;
      } else {
        var root = rootRef.value;
        if (root) {
          isHorizontal ? root.scrollBy(offset, 0) : root.scrollTo(0, offset); // 解决设置OffsetTop无效的问题
        }
      }
    };

    // set current scroll position to bottom
    var scrollToBottom = function scrollToBottom() {
      var shepherd = rootRef.value;
      if (shepherd) {
        var offset = shepherd[isHorizontal ? 'scrollWidth' : 'scrollHeight'];
        scrollToOffset(offset);
      }
    };

    // set current scroll position to a expectant index
    var scrollToIndex = function scrollToIndex(index) {
      // scroll to bottom
      if (index >= props.dataSources.length - 1) {
        scrollToBottom();
      } else {
        var offset = virtual.getOffset(index);
        scrollToOffset(offset);
      }
    };

    // when using page mode we need update slot header size manually
    // taking root offset relative to the browser as slot header size
    var updatePageModeFront = function updatePageModeFront() {
      var root = rootRef.value;
      if (root) {
        var rect = root.getBoundingClientRect();
        var defaultView = root.ownerDocument.defaultView;
        var offsetFront = isHorizontal ? rect.left + defaultView.pageXOffset : rect.top + defaultView.pageYOffset;
        virtual.updateParam('slotHeaderSize', offsetFront);
        console.log('virtual:', virtual.param);
      }
    };

    // reset all state back to initial
    var reset = function reset() {
      virtual.destroy();
      scrollToOffset(0);
      installVirtual();
    };

    // event called when each item mounted or size changed
    var onItemResized = function onItemResized(id, size) {
      virtual.saveSize(id, size);
      emit(RESIZED_EVENT, id, size);
    };

    // event called when slot mounted or size changed
    var onSlotResized = function onSlotResized(type, size, hasInit) {
      if (slots.header() || slots.footer()) {
        if (type === SLOT_TYPE.HEADER) {
          virtual.updateParam('slotHeaderSize', size);
        } else if (type === SLOT_TYPE.FOOTER) {
          virtual.updateParam('slotFooterSize', size);
        }
        if (hasInit) {
          virtual.handleSlotSizeChange();
        }
      }
    };

    // emit event in special position
    var emitEvent = function emitEvent(offset, clientSize, scrollSize, evt) {
      emit('scroll', evt, virtual.getRange());
      if (virtual.isFront() && !!props.dataSources.length && offset - props.topThreshold <= 0) {
        emit(TO_TOP_EVENT);
      } else if (virtual.isBehind() && offset + clientSize + props.bottomThreshold >= scrollSize) {
        emit(TO_BOTTOM_EVENT);
      }
    };
    var onScroll = function onScroll(evt) {
      var offset = getOffset();
      var clientSize = getClientSize();
      var scrollSize = getScrollSize();

      // iOS scroll-spring-back behavior will make direction mistake
      if (offset < 0 || offset + clientSize > scrollSize + 1 || !scrollSize) {
        return;
      }
      virtual.handleScroll(offset);
      emitEvent(offset, clientSize, scrollSize, evt);
    };

    // get the real render slots based on range data
    // in-place patch strategy will try to reuse components as possible
    // so those components that are reused will not trigger lifecycle mounted
    var getRenderSlots = function getRenderSlots() {
      var _slots = [];
      var _rangeRef$value = rangeRef.value,
        start = _rangeRef$value.start,
        end = _rangeRef$value.end;
      try {
        var dataSources = props.dataSources,
          dataKey = props.dataKey,
          itemClass = props.itemClass,
          itemTag = props.itemTag,
          itemStyle = props.itemStyle,
          extraProps = props.extraProps,
          itemScopedSlots = props.itemScopedSlots,
          itemClassAdd = props.itemClassAdd;
        var slotComponent = slots && slots["default"];
        for (var index = start; index <= end; index++) {
          var dataSource = dataSources[index];
          if (dataSource) {
            var uniqueKey = typeof dataKey === 'function' ? dataKey(dataSource) : dataSource[dataKey];
            if (typeof uniqueKey === 'string' || typeof uniqueKey === 'number') {
              var tempNode = createVNode(VirtualListItem, {
                index: index,
                key: index,
                // Vue3采用Key变更刷新，最省事
                tag: itemTag,
                horizontal: isHorizontal,
                uniqueKey: uniqueKey,
                source: dataSource,
                extraProps: extraProps,
                slotComponent: slotComponent,
                scopedSlots: itemScopedSlots,
                style: itemStyle,
                onItemResized: onItemResized,
                "class": "list-item-dynamic ".concat(itemClass, " ").concat(itemClassAdd ? " ".concat(itemClassAdd(index)) : '')
              });
              _slots.push(tempNode);
            } else {
              console.warn("Cannot get the data-key '".concat(dataKey, "' from data-sources."));
            }
          } else {
            console.warn("Cannot get the index '".concat(index, "' from data-sources."));
          }
        }
        return _slots;
      } catch (e) {
        console.warn(e);
      }
    };
    watch(function () {
      return props.dataSources;
    }, function () {
      virtual.updateParam('uniqueIds', getUniqueIdFromDataSources());
      virtual.handleDataSourcesChange();
    }, {
      deep: true
    });
    watch(function () {
      return props.keeps;
    }, function (newValue) {
      virtual.updateParam('keeps', newValue);
      virtual.handleSlotSizeChange();
    });
    watch(function () {
      return props.start;
    }, function (newValue) {
      scrollToIndex(newValue);
    });
    watch(function () {
      return props.offset;
    }, function (newValue) {
      scrollToOffset(newValue);
    });

    // set back offset when awake from keep-alive
    onActivated(function () {
      scrollToOffset(virtual.offset);
      if (props.pageMode) {
        document.addEventListener('scroll', onScroll, {
          passive: false
        });
      }
    });
    onDeactivated(function () {
      if (props.pageMode) {
        document.removeEventListener('scroll', onScroll);
      }
    });
    onMounted(function () {
      // set position
      if (props.start) {
        scrollToIndex(props.start);
      } else if (props.offset) {
        scrollToOffset(props.offset);
      }
      // in page mode we bind scroll event to document
      if (props.pageMode) {
        updatePageModeFront();
        document.addEventListener('scroll', onScroll, {
          passive: false
        });
      }
    });
    onBeforeUnmount(function () {
      if (props.pageMode) {
        document.removeEventListener('scroll', onScroll);
      }
    });
    return {
      reset: reset,
      scrollToBottom: scrollToBottom,
      scrollToIndex: scrollToIndex,
      scrollToOffset: scrollToOffset,
      getSize: getSize,
      getSizes: getSizes,
      getOffset: getOffset,
      getClientSize: getClientSize,
      getScrollSize: getScrollSize,
      onScroll: onScroll,
      getRenderSlots: getRenderSlots,
      onItemResized: onItemResized,
      onSlotResized: onSlotResized,
      updatePageModeFront: updatePageModeFront,
      fullHeight: fullHeight,
      isHorizontal: isHorizontal,
      rootRef: rootRef,
      shepherdRef: shepherdRef,
      rangeRef: rangeRef
    };
  },
  render: function render() {
    var _this = this;
    var _this$rangeRef = this.rangeRef,
      padFront = _this$rangeRef.padFront,
      padBehind = _this$rangeRef.padBehind;
    var isHorizontal = this.isHorizontal,
      pageMode = this.pageMode,
      rootTag = this.rootTag,
      wrapTag = this.wrapTag,
      wrapClass = this.wrapClass,
      wrapStyle = this.wrapStyle,
      fullHeight = this.fullHeight,
      containerClass = this.containerClass;
    // wrap style
    var horizontalStyle = {
      position: 'absolute',
      bottom: 0,
      top: 0,
      left: "".concat(padFront, "px"),
      right: "".concat(padBehind, "px")
    };
    var verticalStyle = {
      position: 'absolute',
      left: 0,
      right: 0,
      top: "".concat(padFront, "px"),
      bottom: "".concat(padBehind, "px")
    };
    var extraStyle = isHorizontal ? horizontalStyle : verticalStyle;
    var wrapperStyle = wrapStyle ? Object.assign({}, wrapStyle, extraStyle) : extraStyle;
    // root style
    var rootStyle = isHorizontal ? {
      position: 'relative',
      width: "".concat(fullHeight, "px")
    } : {
      position: 'relative',
      height: "".concat(fullHeight, "px")
    };
    return h('div', {
      "class": containerClass,
      onScroll: function onScroll(e) {
        if (pageMode) return;
        _this.onScroll(e);
      }
    }, [h(rootTag, {
      style: rootStyle,
      ref: function ref(el) {
        if (el) _this.rootRef = el.parentElement;
      }
    }, [
    // 主列表
    createVNode(wrapTag, {
      "class": wrapClass,
      role: 'group',
      style: wrapperStyle
    }, this.getRenderSlots())])]);
  }
});

// install方法必须有
var index = {
  install: function install(Vue) {
    Vue.component('VirtualList', VirtualList);
  }
};

export { index as default };
