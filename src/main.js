/**
 * virtual list default component
 * rewrite by uct8086
 */
/*global document:readonly, console:readonly*/
import {
    defineComponent,
    watch,
    onActivated,
    onMounted,
    ref,
    createVNode,
    computed,
    h,
    onDeactivated,
    onBeforeUnmount,
} from 'vue';
import Virtual from './virtual';
import { VirtualListItem } from './listItem';
import { VirtualProps } from './props';

const TO_TOP_EVENT = 'totop';
const TO_BOTTOM_EVENT = 'tobottom';
const RESIZED_EVENT = 'resized';

const SLOT_TYPE = {
    HEADER: 'thead', // string value also use for aria role attribute
    FOOTER: 'tfoot',
};

export default defineComponent({
    name: 'VirtualList',
    props: VirtualProps,
    emits: [TO_TOP_EVENT, TO_BOTTOM_EVENT, RESIZED_EVENT, 'scroll'],
    setup (props, { emit, slots }) {
        const isHorizontal = props.direction === 'horizontal';
        const directionKey = isHorizontal ? 'scrollLeft' : 'scrollTop';

        const rootRef = ref();
        const shepherdRef = ref();
        const rangeRef = ref(Object.create(null));

        let virtual = null;

        const fullHeight = computed(() => {
            const { padBehind } = rangeRef.value;
            if (padBehind !== 0) {
                return (
                    virtual &&
                    virtual.getEstimateSize() * props.dataSources.length
                );
            }
            return virtual.getTotalSize();
        });

        const getUniqueIdFromDataSources = () => {
            const { dataKey } = props;
            return props.dataSources.map((dataSource) =>
                typeof dataKey === 'function'
                    ? dataKey(dataSource)
                    : dataSource[dataKey],
            );
        };

        const installVirtual = () => {
            virtual = new Virtual(
                {
                    slotHeaderSize: 0,
                    slotFooterSize: 0,
                    keeps: props.keeps,
                    estimateSize: props.estimateSize,
                    buffer: Math.round(props.keeps / 3), // recommend for a third of keeps
                    uniqueIds: getUniqueIdFromDataSources(),
                },
                (range) => {
                    rangeRef.value = range; // 这里更新Range
                },
            );
            // sync initial range
            rangeRef.value = virtual.getRange();
        };

        installVirtual();

        // get item size by id
        const getSize = (id) => virtual.sizes.get(id);

        // get the total number of stored (rendered) items
        const getSizes = () => virtual.sizes.size;

        // return current scroll offset
        const getOffset = () => {
            if (props.pageMode) {
                return document.documentElement[directionKey] || document.body[directionKey]
            } else {
                const root = rootRef.value;
                return root ? Math.ceil(root[directionKey]) : 0;
            }
        };

        // return client viewport size
        const getClientSize = () => {
            const key = isHorizontal ? 'clientWidth' : 'clientHeight';
            if (props.pageMode) {
                return document.documentElement[key] || document.body[key]
            } else {
                const root = rootRef.value;
                return root ? Math.ceil(root[key]) : 0;
            }
        };

        // return all scroll size
        const getScrollSize = () => {
            const key = isHorizontal ? 'scrollWidth' : 'scrollHeight';
            if (props.pageMode) {
                return document.documentElement[key] || document.body[key]
            } else {
                const root = rootRef.value;
                return root ? Math.ceil(root[key]) : 0;
            }
        };

        // set current scroll position to a expectant offset
        const scrollToOffset = (offset) => {
            if (props.pageMode) {
                document.body[directionKey] = offset
                document.documentElement[directionKey] = offset
            } else {
                const root = rootRef.value;
                if (root) {
                    isHorizontal
                        ? root.scrollBy(offset, 0)
                        : root.scrollTo(0, offset); // 解决设置OffsetTop无效的问题
                }
            }
        };

        // set current scroll position to bottom
        const scrollToBottom = () => {
            const shepherd = rootRef.value;
            if (shepherd) {
                const offset =
                    shepherd[isHorizontal ? 'scrollWidth' : 'scrollHeight'];
                scrollToOffset(offset);
            }
        };

        // set current scroll position to a expectant index
        const scrollToIndex = (index) => {
            // scroll to bottom
            if (index >= props.dataSources.length - 1) {
                scrollToBottom();
            } else {
                const offset = virtual.getOffset(index);
                scrollToOffset(offset);
            }
        };

        // when using page mode we need update slot header size manually
        // taking root offset relative to the browser as slot header size
        const updatePageModeFront = () => {
            const root = rootRef.value;
            if (root) {
                const rect = root.getBoundingClientRect()
                const { defaultView } = root.ownerDocument
                const offsetFront = isHorizontal ? (rect.left + defaultView.pageXOffset) : (rect.top + defaultView.pageYOffset)
                virtual.updateParam('slotHeaderSize', offsetFront)
                console.log('virtual:', virtual.param);
            }
        };

        // reset all state back to initial
        const reset = () => {
            virtual.destroy();
            scrollToOffset(0);
            installVirtual();
        };

        // event called when each item mounted or size changed
        const onItemResized = (id, size) => {
            virtual.saveSize(id, size);
            emit(RESIZED_EVENT, id, size);
        };

        // event called when slot mounted or size changed
        const onSlotResized = (type, size, hasInit) => {
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
        const emitEvent = (offset, clientSize, scrollSize, evt) => {
            emit('scroll', evt, virtual.getRange());

            if (
                virtual.isFront() &&
                !!props.dataSources.length &&
                offset - props.topThreshold <= 0
            ) {
                emit(TO_TOP_EVENT);
            } else if (
                virtual.isBehind() &&
                offset + clientSize + props.bottomThreshold >= scrollSize
            ) {
                emit(TO_BOTTOM_EVENT);
            }
        };

        const onScroll = (evt) => {
            const offset = getOffset();
            const clientSize = getClientSize();
            const scrollSize = getScrollSize();

            // iOS scroll-spring-back behavior will make direction mistake
            if (
                offset < 0 ||
                offset + clientSize > scrollSize + 1 ||
                !scrollSize
            ) {
                return;
            }

            virtual.handleScroll(offset);
            emitEvent(offset, clientSize, scrollSize, evt);
        };

        // get the real render slots based on range data
        // in-place patch strategy will try to reuse components as possible
        // so those components that are reused will not trigger lifecycle mounted
        const getRenderSlots = () => {
            const _slots = [];
            const { start, end } = rangeRef.value;
            try {
                const {
                    dataSources,
                    dataKey,
                    itemClass,
                    itemTag,
                    itemStyle,
                    extraProps,
                    itemScopedSlots,
                    itemClassAdd,
                } = props;
                const slotComponent = slots && slots.default;
                for (let index = start; index <= end; index++) {
                    const dataSource = dataSources[index];
                    if (dataSource) {
                        const uniqueKey =
                            typeof dataKey === 'function'
                                ? dataKey(dataSource)
                                : dataSource[dataKey];
                        if (
                            typeof uniqueKey === 'string' ||
                            typeof uniqueKey === 'number'
                        ) {
                            const tempNode = createVNode(VirtualListItem, {
                                index,
                                key: index, // Vue3采用Key变更刷新，最省事
                                tag: itemTag,
                                horizontal: isHorizontal,
                                uniqueKey,
                                source: dataSource,
                                extraProps,
                                slotComponent,
                                scopedSlots: itemScopedSlots,
                                style: itemStyle,
                                onItemResized,
                                class: `list-item-dynamic ${itemClass} ${
                                    itemClassAdd
                                        ? ` ${itemClassAdd(index)}`
                                        : ''
                                }`,
                            });
                            _slots.push(tempNode);
                        } else {
                            console.warn(
                                `Cannot get the data-key '${dataKey}' from data-sources.`,
                            );
                        }
                    } else {
                        console.warn(
                            `Cannot get the index '${index}' from data-sources.`,
                        );
                    }
                }
                return _slots;
            } catch (e) {
                console.warn(e);
            }
        };

        watch(
            () => props.dataSources,
            () => {
                virtual.updateParam('uniqueIds', getUniqueIdFromDataSources());
                virtual.handleDataSourcesChange();
            },
            {
                deep: true,
            },
        );

        watch(
            () => props.keeps,
            (newValue) => {
                virtual.updateParam('keeps', newValue);
                virtual.handleSlotSizeChange();
            },
        );

        watch(
            () => props.start,
            (newValue) => {
                scrollToIndex(newValue);
            },
        );

        watch(
            () => props.offset,
            (newValue) => {
                scrollToOffset(newValue);
            },
        );

        // set back offset when awake from keep-alive
        onActivated(() => {
            scrollToOffset(virtual.offset);
            if (props.pageMode) {
                document.addEventListener('scroll', onScroll, {
                    passive: false,
                })
            }
        });

        onDeactivated(() => {
            if (props.pageMode) {
                document.removeEventListener('scroll', onScroll)
            }
        })

        onMounted(() => {
            // set position
            if (props.start) {
                scrollToIndex(props.start);
            } else if (props.offset) {
                scrollToOffset(props.offset);
            }
            // in page mode we bind scroll event to document
            if (props.pageMode) {
                updatePageModeFront()

                document.addEventListener('scroll', onScroll, {
                    passive: false,
                })
            }
        });

        onBeforeUnmount(() => {
            if (props.pageMode) {
                document.removeEventListener('scroll', onScroll)
            }
        });

        return {
            reset,
            scrollToBottom,
            scrollToIndex,
            scrollToOffset,
            getSize,
            getSizes,
            getOffset,
            getClientSize,
            getScrollSize,
            onScroll,
            getRenderSlots,
            onItemResized,
            onSlotResized,
            updatePageModeFront,
            fullHeight,
            isHorizontal,
            rootRef,
            shepherdRef,
            rangeRef,
        };
    },
    render () {
        const { padFront, padBehind } = this.rangeRef;
        const {
            isHorizontal,
            pageMode,
            rootTag,
            wrapTag,
            wrapClass,
            wrapStyle,
            fullHeight,
            containerClass,
        } = this;
        // wrap style
        const horizontalStyle = {
            position: 'absolute',
            bottom: 0,
            top: 0,
            left: `${padFront}px`,
            right: `${padBehind}px`,
        };
        const verticalStyle = {
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${padFront}px`,
            bottom: `${padBehind}px`,
        };
        const extraStyle = isHorizontal ? horizontalStyle : verticalStyle;
        const wrapperStyle = wrapStyle
            ? Object.assign({}, wrapStyle, extraStyle)
            : extraStyle;
        // root style
        const rootStyle = isHorizontal
            ? { position: 'relative', width: `${fullHeight}px` }
            : { position: 'relative', height: `${fullHeight}px` };

        return h(
            'div', {
                class: containerClass,
                onScroll: (e) => {
                    if (pageMode) return;
                    this.onScroll(e);
                },
            }, [
                h(
                    rootTag,
                    {
                        style: rootStyle,
                        ref: (el) => {
                            if (el) this.rootRef = el.parentElement;
                        },
                    },
                    [
                    // 主列表
                        createVNode(
                            wrapTag,
                            {
                                class: wrapClass,
                                role: 'group',
                                style: wrapperStyle,
                            },
                            this.getRenderSlots(),
                        ),
                    ],
                )],
        );
    },
});
