// **************************************
// 2014 - Touch UI 
// **************************************
(function () {
    var transitionClasses = 'app-transition app-animation-spin ui-icon-refresh',
        itemSelectedClasses = 'ui-btn-icon-right ui-icon-check',
        userAgent = navigator.userAgent,
        platform = navigator.platform,
        iOS = /iPhone|iPad|iPod/.test(platform) && userAgent.indexOf("AppleWebKit") > -1,
        iOSMajorVersion = iOS ? parseInt(navigator.userAgent.match(/\(i.*;.*CPU.*OS (\d)_\d/)[1]) : null,
        android = /Android/i.test(userAgent),
        chrome = /chrom(e|ium)/i.test(userAgent),
        ie = (!!userAgent.match(/Trident\/7\./)),
        iePointerType = 'mouse',
        safari = /safari/i.test(userAgent),
        isDesktopClient = platform.match(/Win\d+|Mac/i) != null,
        activatorRegex = /^s*(\w+)\s*\|s*(.+?)\s*(\|\s*(.+)\s*)?$/,
        filterDetailsRegex = /(<(\/*(a|span).*?>)|(&nbsp;)|onclick=\".+?\")/g,
        filterDetailsRegex2 = /(<(\/*(b).*?>))/g,
        filterDetailsRegex3 = /\" ([\.;])/g,
        phoneFieldRegex = /phone/i,
        emailFieldRegex = /email/i,
        urlFieldRegex = /\burl/i,
        mapFieldRegex = /phone/i,
        sortByRegex = /^\s*(\w+)(\s+(\w+)\s*)?$/,
        filterWithoutInputRegex = /\$(true|false|in|notin|tomorrow|today|yesterday|next|this|last|year|past|future|quarter|month|isempty|isnotempty)/,
        membership,
        userScope = '',
        anonymousScope = '',
        resources = Web.DataViewResources,
        resourcesViews = resources.Views,
        resourcesMenu = resources.Menu,
        resourcesData = resources.Data,
        resourcesPager = resources.Pager,
        resourcesModalPopup = resources.ModalPopup,
        resourcesHeaderFilter = resources.HeaderFilter,
        resourcesMobile = resources.Mobile,
        resourcesGrid = resources.Grid,
        resourcesForm = resources.Form,
        resourcesActions = resources.Actions,
        resourcesValidator = resources.Validator,
        resourcesLookup = resources.Lookup,
        resourcesMembershipBar = Web.MembershipResources && Web.MembershipResources.Bar,
        resourcesInfoBar = resources.InfoBar,
        resourcesNo = resourcesData.BooleanDefaultItems[0][1],
        resourcesYes = resourcesData.BooleanDefaultItems[1][1],
        toolbarStandardControls,
        toolbarSearchControls,
        fixedPositionTimeout,
        scrollInterval, scrollStopTimeout,
        popupOpenCallback,
        popupCloseCallback,
        panelIsBusy,
        menuActionOnClose, skipMenuActionOnClose, contextActionOnClose, skipContextActionOnClose,
        contextSidebarRefreshTimeout, sidebarElement, echoTimeout, clearContextScopeTimeout,
        skipTap, touchScrolling, pageChangeCallback, isInTransition,
        contextPanelScrolling = {},
        currentContext,
        newSortExpression,
        skipInfoView,
        yardstickData = {},
        autoFocus,
        maxGeoCacheSize = 500, maxMapMarkers = 500,
        autoId = 0,
        rootDataViewId,
        _focusedInput, _lastFocusedInput, _pendingPageText, _geoLocations,
        _webkitPreventMainReload = true,
        feedbackFrom,
        contentFramework,
        settings,
        _window = window,
        $body,
        $window = $(_window),
        $mobile = $.mobile,
        feedbackTimeout = 100,
        calculateCausedBy = [],
        afterCalculateRetryInterval,
        passiveCalculateTimeout,
        passiveCalculateOldValue,
        calculateLastCausedBy,
        _pendingQueryText,
    // icons
        iconCaratU = '<svg class="app-icon-carat-u" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="14px" height="14px" viewBox="0 0 14 14" style="enable-background:new 0 0 14 14;" xml:space="preserve"><polygon class="app-icon-themed" points="2.051,10.596 7,5.646 11.95,10.596 14.07,8.475 7,1.404 -0.071,8.475 "></polygon></svg>',
        iconCaratD = '<svg class="app-icon-carat-d"  version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"  width="14px" height="14px" viewBox="0 0 14 14" style="enable-background:new 0 0 14 14;" xml:space="preserve"><polygon class="app-icon-themed" points="11.949,3.404 7,8.354 2.05,3.404 -0.071,5.525 7,12.596 14.07,5.525 "/></svg>',
        iconCheck = '<svg class="app-icon-check" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="-62 64 14 14" enable-background="new -62 64 14 14" xml:space="preserve"><polygon class="app-icon-themed" points="-48,67 -49.8,65.2 -57,72.4 -60.2,69.2 -62,71 -58.7,74.2 -58.8,74.2 -57,76 -57,76 -56.9,76 -55.2,74.2 -55.2,74.2 "/></svg>';

    function pathToId(path) {
        var id = path.replace(/\.\w+$/, '').replace(/\W/g, '_').toLowerCase() || 'page';
        if (id.match(/^\_/))
            id = id.substring(1);
        return id;
    }

    function isDesktop() {
        return isDesktopClient && iePointerType == 'mouse';
    }

    function progressIndicatorInPanel() {
        return $('.ui-panel-open .ui-btn.app-animated');
    }

    function progressIndicatorInPopup() {
        return $('.ui-popup-active .ui-btn.app-animated');
    }


    function landscapeOrientation() {
        return $window.width() > $window.height();
    }

    function promoteSearch() {
        mobile.promo('search', resourcesGrid.PerformAdvancedSearch);
        mobile.promo().data('icon-list', null);
    }

    function clickMenuButton() {
        var button = mobile._menuButton;
        callWithFeedback(button, function () {
            button.trigger('vclick');
        });
    }

    function updateSidebarVisibility() {
        if (settings.sidebar == 'Landscape')
            if (landscapeOrientation())
                $body.removeClass('app-sidebar-undocked');
            else
                $body.addClass('app-sidebar-undocked');
        else if (settings.sidebar == 'Never')
            $body.addClass('app-sidebar-undocked');
        else
            $body.removeClass('app-sidebar-undocked');
    }

    function openHref(href) {
        if (isDesktop())
            _window.open(href);
        else
            _window.location.href = href;
    }

    function checkBoxRadioHeight() {
        switch (settings.displayDensity) {
            case 'Comfortable':
                return 46;
            case 'Compact':
                return 40
        }
        return 35;
    }

    function timeNow() {
        return new Date().getTime();
    }

    function cssUnitsToNumber(value) {
        return parseFloat(value.replace(/[A-Za-z]/g, ''));
    }

    function safePoint(p) {
        if (p.x != null)
            p.x = Math.ceil(p.x);
        if (p.y != null)
            p.y = Math.ceil(p.y);
        return p;
    }

    function formatQuickFindPlaceholder(dataView) {
        return String.format('{0} - {1}', resourcesGrid.QuickFindText, dataView.get_view().Label);
    }

    function executeRefreshCallback(pageInfo) {
        if (pageInfo.refreshCallback) {
            pageInfo.refreshCallback();
            pageInfo.refreshCallback = null;
        }
    }

    function nowToString() {
        return String.format('{0:' + $app.dateFormatStrings['{0:f}'] + '}', new Date());
    }

    function enablePanelAnimation(panel) {
        var enable = settings.pageTransition != 'none';
        if (arguments.length == 0)
            return enable;
        if (!enable)
            panel.removeClass('ui-panel-animate');
    }

    function appendMoreButton(dataView, link) {
        if (dataView._hasKey())
            $('<span class="app-btn-more">&nbsp;</span>').appendTo(link).attr('title', resourcesMobile.More);
    }

    function inputCaretPos(input, position) {
        input = $(input);
        if (input.length)
            input[0].selectionStart = input[0].selectionEnd = position;
    }

    function quickFind(dataView, query) {
        dataView.extension().quickFind(query);
        waitForDataView(dataView);
    }

    function advancedSearchFilter(dataView) {
        var filter = [];
        if (dataView && dataView.viewProp('useAdvancedSearch'))
            filter = dataView.viewProp('advancedSearchFilter') || filter;
        return filter;
    }

    function applyDataFilter(dataView) {
        resetInstruction(dataView);
        persistDataFilter(dataView);
        $(dataView._allFields).each(function () {
            delete this._listOfValues;
        });
        dataView._forceSync();
        dataView.refreshData();
        enableHeading();
        waitForDataView(dataView);
    }

    function clearDataFilter(dataView, keepAdvancedSearch) {
        if (!keepAdvancedSearch && advancedSearchFilter(dataView).length)
            dataView.viewProp('advancedSearchFilter', null);
        dataView.clearFilter();
        applyDataFilter(dataView);
    }

    function persistDataFilter(dataView) {
        var filter = (dataView.get_filter() || []).slice(0),
            externalFields = [],
            expression, i = 0;
        $(dataView.get_externalFilter()).each(function () {
            externalFields.push(this.Name);
        });
        while (i < filter.length) {
            expression = filter[i];
            if (Array.indexOf(externalFields, expression.match(/^\w+/)[0]) != -1)
                filter.splice(i, 1);
            else
                i++;
        }
        dataView.viewProp('filter', filter);
    }

    function menuStripIsVisible() {
        var menuStripInfo = mobile._menuStrip;
        return menuStripInfo && menuStripInfo.strip.is(':visible');
    }

    function updateMenuStripState(visible) {
        var menuStripInfo = mobile._menuStrip,
            menuStrip = menuStripInfo && menuStripInfo.strip,
            menuPanel = mobile._menuPanel;
        if (menuStrip) {
            var externalLinks = $(menuPanel).find('li a[rel="external"]'),
                externalItems = externalLinks.parent(),
                listDividers = $(menuPanel).find('.ui-li-divider:not(.app-info):not(.app-copy)');
            if (arguments.length == 0)
                visible = menuStripIsVisible();
            if (visible) {
                menuStrip.show();
                externalItems.hide();
                listDividers.hide();
            }
            else {
                menuStrip.hide();
                externalItems.show();
                listDividers.show();
            }
        }
    }

    function addSeparator(list) {
        if (list.length && list[list.length - 1].text)
            list.push({});
    }

    function ensureCausesCalculate(target) {
        target = $(target);
        causesCalculate = target.attr('data-causes-calculate');
        if (causesCalculate)
            mobile.causesCalculate(causesCalculate);
        // re-calculate the visual state of the current view
        var dataView = mobile.dataView();
        if (dataView && !target.is(':checkbox,:radio'))
            setTimeout(function () {
                dataView.extension().calculate(mobile.dataView());
            }, 200);
    }

    function handleTriggeredCheckboxRadioClicks(event) {
        var target = $(event.target),
            parentFieldSetContainer,
            input,
            field,
            newValue = [],
            oldValue;
        parentFieldSetContainer = target.closest('.app-container-scrollable');
        if (parentFieldSetContainer.length) {
            input = parentFieldSetContainer.next();
            field = parentFieldSetContainer.data('data-field');
            parentFieldSetContainer.find(':checkbox,:radio').each(function (index) {
                if ($(this).is(':checked')) {
                    if (newValue.length)
                        newValue.push(',');
                    newValue.push(field.Items[index][0]);
                }
            });
            oldValue = input.val();
            input.val(newValue.join(''));
            if (oldValue != input.val())
                ensureCausesCalculate(input);
        }
    }

    function adjustScrollableContainers(content, regroup) {
        content.find('.app-container-scrollable').each(function () {
            var maxWidth = 0,
                maxHeight = 0,
                scrollableContainer = $(this),
                fieldColumns = parseInt(scrollableContainer.attr('data-columns')),
                fieldSets = scrollableContainer.find('fieldset');
            if (regroup) {
                var inputs = fieldSets.find(':input'),
                    itemsPerColumn = Math.min(Math.ceil(inputs.length / (fieldColumns > 1 ? fieldColumns : 1)), Math.max(Math.ceil(mobile.screen().height * .45 / checkBoxRadioHeight()), 3)),
                    fieldSet,
                    newFieldSets = [];
                fieldSets.find(':checkbox,:input').checkboxradio('destroy').off('click');
                fieldSets.controlgroup('destroy');
                inputs.each(function (index) {
                    if (index % itemsPerColumn == 0) {
                        fieldSet = $('<fieldset class="app-controlgroup-vertical"/>').appendTo(scrollableContainer);
                        newFieldSets.push(fieldSet);
                    }
                    var input = $(this),
                        label = input.prev();
                    label.appendTo(fieldSet);
                    input.appendTo(fieldSet);
                });
                fieldSets.remove();
                fieldSets = $(newFieldSets).controlgroup().find(':checkbox,:radio').checkboxradio();
                scrollableContainer.find(':checkbox,:radio').on('click', handleTriggeredCheckboxRadioClicks);
            }


            if (!regroup)
                fieldSets.each(function () {
                    $(this).height('').find('.ui-checkbox,.ui-radio').width('');
                });
            fieldSets.each(function () {
                var fieldSet = $(this),
                    w = fieldSet.width(),
                    h = fieldSet.height();
                if (w > maxWidth)
                    maxWidth = w;
                if (h > maxHeight)
                    maxHeight = h;
            });
            fieldSets.each(function () {
                $(this).height(maxHeight).find('.ui-checkbox,.ui-radio').width(maxWidth + 1);
            });
        });

    }

    function clearHtmlSelection() {
        try {
            if (_window.getSelection) {
                var range = _window.getSelection();
                if (range && range.rangeCount > 0)
                    range.removeAllRanges();
            }
            else if (document.selection)
                document.selection.empty();
        }
        catch (ex) {
        }
    }

    function hideMenuStrip(enable) {
        var stripInfo = mobile._menuStrip,
            strip = stripInfo && stripInfo.strip;
        if (strip) {
            strip.hide();
            if (arguments.length == 1)
                strip.attr('data-enabled', enable ? 'true' : 'false');
        }
    }

    function changeViewStyle(listview, viewStyle) {
        if (viewStyle == 'Cards')
            listview.addClass('app-cardview').removeClass('app-grid');
        else if (viewStyle == 'Grid')
            listview.addClass('app-grid').removeClass('app-cardview');
        else if (viewStyle == 'List')
            listview.removeClass('app-cardview app-grid');
    }

    function resetMapHeight(wrapper) {
        wrapper.find('> .app-map').each(function () {
            var mapView = $(this),
                header = wrapper.find('> .app-page-header:visible'),
                instruction = wrapper.find('> .app-map-instruction:visible'),
                elementAbove = $(instruction.length && instruction || header.length && header),
                mapInfo = mapView.data('data-map');
            mapView.css('top', elementAbove.length ? elementAbove.position().top + elementAbove.outerHeight(true) : 0);
            if (mapView.is(':visible') && mapInfo) {
                var map = mapInfo.map,
                    center = map.getCenter();
                google.maps.event.trigger(map, "resize");
                map.setCenter(center);
            }
        });
    }

    function resetInvisiblePageHeight(page) {
        page.css({ 'display': 'block', 'z-index': -10 });
        resetPageHeight(page);
        page.css({ 'display': '', 'z-index': '' });
    }

    function resetPageHeight(page) {
        var activePage = $mobile.activePage;
        if (!page)
            page = activePage;
        var
            isActive = page == activePage,
            prototypePage = isActive ? page : activePage,
            pagePaddingTop = prototypePage.css('padding-top'),
            pageMinHeight = prototypePage.css('min-height'),
            tabs = page.find('.ui-content > .app-tabs'),
            fixedTop = contentFramework && page.find(contentFramework.fixedTop.selector),
            fixedTopHeight = fixedTop && fixedTop.css('position') == 'fixed' && fixedTop.outerHeight(),
            fixedBottom = contentFramework && page.find(contentFramework.fixedBottom.selector),
            fixedBottomHeight = fixedBottom && fixedBottom.css('position') == 'fixed' && fixedBottom.outerHeight(),
            wrapperBottom = 0;
        if (isActive) {
            $mobile.resetActivePageHeight();
            pageMinHeight = prototypePage.css('min-height');
        }
        else
            page.css({ 'padding-top': pagePaddingTop, 'min-height': pageMinHeight });
        pageMinHeight = parseInt(pageMinHeight.substring(0, pageMinHeight.length - 2));
        pagePaddingTop = parseInt(pagePaddingTop.substring(0, pagePaddingTop.length - 2))
        page.find('.app-wrapper').each(function () {
            var wrapper = $(this),
                tabsHeight = tabs.length ? tabs.outerHeight(true) : 0;
            if (tabsHeight) {
                pageMinHeight = pageMinHeight - tabsHeight;
                pagePaddingTop = pagePaddingTop + tabsHeight;
            }
            if (fixedTopHeight) {
                pageMinHeight -= fixedTopHeight;
                pagePaddingTop += fixedTopHeight;
            }
            if (fixedBottomHeight) {
                pageMinHeight -= fixedBottomHeight;
                wrapperBottom += fixedBottomHeight;
            }
            wrapper.css({ 'top': pagePaddingTop, bottom: wrapperBottom, 'min-height': pageMinHeight });
            if (isActive)
                wrapper.css({ 'height': pageMinHeight });
            resetMapHeight(wrapper);
        });
    }

    function allowCompactDensity() {
        return ie ? $window.width() >= 720 : $window.width() >= 768 && $window.height() >= 704;
    }

    function initTouchUI() {
        var sysSettings = __settings,
            mobileDisplayDensity = sysSettings.mobileDisplayDensity,
            sysBrowser = Sys.Browser,
            futureDate,
            expires,
            cookie,
            pageHeaderParent = $('#PageHeader').parent(),
            pageTheme = (pageHeaderParent.attr('class') || '').match(/\bpage-theme-(\w+)\b/i),
            firstContentPage = $('div[data-content-framework]:first'),
            buttonShapes = userVariable('buttonShapes'),
            promoteActions = userVariable('promoteActions');

        function validateSidebar(value) {
            return value && value.match(/Landscape|Always|Never/);
        }

        settings = {
            mapApiIdentifier: sysSettings.mapApiIdentifier,
            pageTransition: userVariable('pageTransition') || sysSettings.transitions || (android ? 'fade' : 'slide'),
            sidebar: userVariable('sidebar') || validateSidebar(sysSettings.sidebar) || 'Landscape',
            theme: pageTheme && pageTheme[1] || userVariable('theme') || sysSettings.theme,
            themeDisabled: pageTheme != null,
            displayDensity: userVariable('displayDensity') || (isDesktop() ?
                sysSettings.desktopDisplayDensity :
                (mobileDisplayDensity == 'Auto' ? (allowCompactDensity() ? 'Compact' : 'Comfortable') : mobileDisplayDensity)),
            labelsInForm: userVariable('labelsInForm') || sysSettings.labelsInForm,
            labelsInList: userVariable('labelsInList') || sysSettings.labelsInList,
            buttonShapes: buttonShapes != null ? buttonShapes : (sysSettings.buttonShapes || true),
            promoteActions: promoteActions != null ? promoteActions : (sysSettings.promoteActions || true),
            initialListMode: userVariable('initialListMode') || sysSettings.initialListMode || 'SeeAll'
        };

        if (sysBrowser.agent == sysBrowser.InternetExplorer && sysBrowser.version <= 9) {
            $body.hide();
            if (sysSettings && sysSettings.ui) {
                futureDate = new Date().getDate() + 365,
                expires = new Date();
                expires.setDate(futureDate);
                cookie = String.format('appfactorytouchui=false; expires={0}; path=/', expires.toUTCString());
                document.cookie = cookie;
                location.reload($mobile.path.parseUrl(location.href).hrefNoHash);
            }
            else
                alert(resourcesMobile.TouchUINotSupported);
        }

        if (iOS) {
            $body.addClass('app-ios');
            if (iOSMajorVersion < 8)
                $body.addClass('app-ios7');
        }
        if (android)
            $body.addClass('app-android');

        if (settings.buttonShapes == false)
            $body.addClass('app-buttons-text-only');

        //$('<link href="http://fonts.googleapis.com/css?family=Roboto" rel="stylesheet" type="text/css">').appendTo($('head'));

        if (pageHeaderParent.is('.Tall'))
            $body.addClass('app-page-header-hidden');
        if (pageHeaderParent.is('.Wide') || (firstContentPage.length && firstContentPage.attr('data-sidebar') != 'true')) {
            settings.sidebar = 'Never';
            settings.sidebarDisabled = true;
        }

        $(document).trigger($.Event('appinit'));

        $mobile.defaultPageTransition = settings.pageTransition;
        updateSidebarVisibility();

        if (!settings.displayDensity)
            settings.displayDensity = isDesktop() ? 'Compact' : 'Comfortable';

        $body.addClass(themeToClass(settings.theme));
        $body.addClass(displayDensityToClass(settings.displayDensity));
        if (settings.labelsInForm == 'AlignedRight')
            $body.addClass('app-labelsinform-alignedright');
        if (settings.labelsInList == 'DisplayedAbove')
            $body.addClass('app-labelsinlist-displayedabove');

        if (isDesktop()) {
            var dtf = Sys.CultureInfo.CurrentCulture.dateTimeFormat;
            $.datepicker.setDefaults(
            {
                prevText: '',
                nextText: '',
                monthNames: dtf.MonthNames,
                monthNamesShort: dtf.AbbreviatedMonthNames,
                dayNames: dtf.DayNames,
                dayNamesShort: dtf.AbbreviatedDayNames,
                dayNamesMin: dtf.ShortestDayNames,
                firstDay: dtf.FirstDayOfWeek,
                constrainInput: false,
                showOtherMonths: true,
                changeMonth: true,
                changeYear: true
            });
            $.datepicker.parseDate = function (format, value, settings) {
                var fmt = $(this._lastInput).attr('data-format-string') || '{0:d}',
                    d = Date.tryParseFuzzyDate(value, fmt);
                return d;
            }
            $.datepicker.formatDate = function (format, date, settings) {
                var input = $(this._lastInput),
                    fmt = input.attr('data-format-string') || '{0:d}',
                    d = Date.tryParseFuzzyDate(input.val(), fmt);
                if (d) {
                    date.setHours(d.getHours());
                    date.setMinutes(d.getMinutes());
                    date.setSeconds(d.getSeconds());
                }
                return String.localeFormat(fmt, date);
            }

        }
    }

    function focusFormInput(content) {
        if (autoFocus != false && !isInTransition) {
            var input = content.find('.ui-collapsible:visible .ui-collapsible-heading:not(.ui-collapsible-heading-collapsed):first').parent().find(':input:first').first();
            if (input.length) {
                var wrapper = input.closest('.app-wrapper'),
                    wrapperTop = wrapper.offset().top,
                    wrapperScrollTop = wrapper.scrollTop(),
                    wrapperHeight = wrapper.height(),
                    inputTop = input.offset().top + wrapperScrollTop - wrapperTop,
                    inputHeight = input.outerHeight(true);

                function setFocus() {
                    if (isDesktop()) {
                        headingOnDemand();
                        input.focus();
                        if (input[0].select)
                            input[0].select();
                    }
                }

                if (inputTop < wrapperScrollTop || inputTop + inputHeight > wrapperScrollTop + wrapperHeight) {
                    isInTransition = true;
                    animatedScroll(wrapper, inputTop - (wrapperHeight - inputHeight) / 2, function () {
                        isInTransition = false;
                        setFocus();
                    });
                }
                else
                    setFocus();
            }
        }
    }

    function isDeveloperEvent(event) {
        return (event.metaKey || event.ctrlKey) && event.shiftKey;
    }

    function showToolTip(target) {
        var result = false;
        if (target.is('span')) {
            if (target.get(0).scrollWidth - target.innerWidth() > 0) {
                var popup = $('<div class="ui-content app-popup-message"/>').html(target.text()).popup({
                    history: false,
                    arrow: 'b,t',
                    overlayTheme: 'b',
                    positionTo: 'origin',
                    afteropen: function () {
                    },
                    afterclose: function () {
                        destroyPopup(popup);
                    }
                }).popup('open', { x: target.offset().left + target.outerWidth() / 2, y: target.offset().top }).on('vclick', function () {
                    closePopup(popup);
                    return false;
                });
                result = true;
            }
        }
        return result;
    }

    function fitTabs(page) {
        mobile.tabs('fit', { page: page });
    }

    function hrefToPageId(href) {
        var loc = $mobile.path.parseUrl(href);
        return loc.pathname.replace(/\//g, '-');
    }

    function restoreScrolling(page) {
        $(page).find('.app-wrapper').each(function () {
            var wrapper = $(this),
                scrollTop = wrapper.data('scroll-top');
            if (scrollTop && wrapper.scrollTop() != scrollTop) {
                wrapper/*.height(wrapper.height())*/.scrollTop(scrollTop);
            }
        });
        $(page).find('.app-echo-inner').each(function () {
            var wrapper = $(this),
                scrollLeft = wrapper.data('scroll-left');
            if (wrapper.parent().is(':visible') && scrollLeft && wrapper.scrollLeft() != scrollLeft) {
                wrapper.scrollLeft(scrollLeft);
            }
        });
    }

    function saveScrolling(page) {
        $(page).find('.app-wrapper').each(function () {
            var wrapper = $(this);
            wrapper.data('scroll-top', wrapper.scrollTop());
        });
        $(page).find('.app-echo-inner').each(function () {
            var wrapper = $(this);
            if (wrapper.parent().is(':visible'))
                wrapper.data('scroll-left', wrapper.scrollLeft());
        });
    }

    function getScrollInfo(wrapper) {

        function findNextVisible(elem) {
            while (elem.css('display') == 'none' && elem.length)
                elem = elem.next();
            return elem;
        }

        var wrapperScrollTop = wrapper.scrollTop(),
            wrapperHeight = wrapper.height(),
            scrolledHeight = wrapperScrollTop + wrapperHeight,
            firstElem = findNextVisible(wrapper.find('*:first')),
            firstElemTop = firstElem.length == 0 ? 0 : Math.ceil(firstElem.position().top - (firstElem.is('ul') && firstElem.find('li:first').length ? parseInt(firstElem.find('> li:first').css('margin-top').replace('px', '')) : 0)),
            lastRootElem = wrapper.find('> *:last'),
            lastElem = lastRootElem.is('ul') && lastRootElem.find('li:first').length ? lastRootElem.find('> li:last') : lastRootElem,
            lastElemTop = lastElem.position().top,
            lastElemBottom = Math.ceil(
                lastElemTop + lastElem.outerHeight()
                + parseInt(lastElem.css('margin-top').replace('px', ''))
                + (ie ? 0 : +parseInt(lastElem.css('margin-bottom').replace('px', '')))
                + parseInt(lastRootElem.css('margin-bottom').replace('px', ''))
                ),
            maxScrollHeight = -1 * (firstElemTop - lastElemBottom);
        return { top: firstElemTop, height: scrolledHeight, maxHeight: maxScrollHeight, firstTop: firstElemTop, lastBottom: lastElemBottom };
    }

    function registerPanelScroller(panel) {
        var wrapper = panel.find('.ui-panel-inner'),
            scrolling, lastScrollTop, scrollInterval;
        if (wrapper.length)
            wrapper.on('scroll keydown keyup', function (event) {
                if (isInTransition)
                    return;
                if (!scrolling) {
                    scrolling = true;
                    lastScrollTop = wrapper.scrollTop();

                    skipTap = true;
                    scrollInterval = setInterval(function () {
                        var scrollTop = wrapper.scrollTop();
                        if (scrollTop != lastScrollTop)
                            lastScrollTop = scrollTop;
                        else {
                            clearInterval(scrollInterval);
                            scrolling = false;
                            skipTap = false;
                            wrapper.data('scroll-stop-time', new Date());
                        }
                    }, 200);
                }
            })
    }

    function unRegisterPanelScroller(panel) {
        wrapper = panel.find('.ui-panel-inner').off('scroll keydown keyup');
    }

    function createScroller(page, handleScrollingEvents) {
        var wrapper = page.find('.app-wrapper:first'),
            content, children,
            scrolling, lastScrollTop, scrollInterval,
            startTime, startScroll, waitForScrollEvent;

        function notifyDir(dir) {
            wrapper.data('scroll-dir', dir);
            $(document).trigger($.Event('scrolldir.app', { relatedTarget: wrapper }));
        }

        if (!wrapper.length) {
            content = page.find('.ui-content');
            children = content.contents();
            wrapper = $('<div class="app-wrapper"/>').appendTo(content);
            if (handleScrollingEvents != false)
                wrapper.on('wheel DOMMouseWheel mousewheel', function (event) {
                    if (scrolling && 'deltaY' in event.originalEvent) {
                        var lastDirection = wrapper.data('scroll-dir'),
                            newDirection = event.originalEvent.deltaY > 0 ? 'down' : 'up';
                        if (newDirection != lastDirection)
                            notifyDir(newDirection);
                    }
                }).on('touchstart', function () {
                    if (iOS && iOSMajorVersion < 8) {
                        waitForScrollEvent = false;
                        touchScrolling = true;
                    }
                }).on('touchmove', function () {
                    if (iOS) {
                        startTime = timeNow();
                        startScroll = wrapper.scrollTop();
                    }
                }).on('touchend', function () {
                    if (iOS && iOSMajorVersion < 8) {
                        var deltaTime = timeNow() - startTime,
                            currentScrollTop = wrapper.scrollTop(),
                            deltaScroll = Math.abs(startScroll - currentScrollTop);
                        if (deltaTime > 0 && deltaScroll / deltaTime > 0.25 || currentScrollTop < 0 || currentScrollTop > wrapper.height())
                            waitForScrollEvent = true;
                        else
                            touchScrolling = false;
                    }
                }).on('scroll', function (event) {
                    if (isInTransition)
                        return;
                    if (!scrolling) {
                        scrolling = true;
                        lastScrollTop = wrapper.scrollTop();

                        $(document).trigger($.Event('scrollstart.app', { relatedTarget: wrapper }));
                        skipTap = true;
                        scrollInterval = setInterval(function () {
                            var scrollTop = wrapper.scrollTop();
                            if (scrollTop != lastScrollTop)
                                lastScrollTop = scrollTop;
                            else {
                                clearInterval(scrollInterval);
                                scrolling = false;
                                skipTap = false;
                                wrapper.data('scroll-stop-time', new Date());
                                $(document).trigger($.Event('scrollstop.app', { relatedTarget: wrapper }));
                                //mobile._title.text('stop');
                                if (waitForScrollEvent) {
                                    waitForScrollEvent = false;
                                    touchScrolling = false;
                                }
                            }
                        }, 200);
                    }
                    else {
                        var lastDirection = wrapper.data('scroll-dir'),
                            scrollTop = wrapper.scrollTop(),
                            newDirection = scrollTop < lastScrollTop ? 'up' : (scrollTop == lastScrollTop ? 'none' : 'down');
                        if (newDirection != lastDirection || wrapper.scrollTop() < $mobile.getScreenHeight())
                            notifyDir(newDirection);
                    }
                    //mobile._title.text((scrolling ? 'start' : 'stop') + ' - ' + event.type + ' / ' + wrapper.data('scroll-dir') + String.format(' {0} : {1}', lastScrollTop, wrapper.scrollTop()));
                })/*.on('swiperight', function (event) {
                    $('#app-btn-menu').trigger('vclick');
                }).on('swipeleft', function (event) {
                    history.go(1);
                })*/;
            if (isDesktop())
                wrapper.attr('tabindex', 0);
            $('<div class="app-page-header"><h2/><h1/></div>').appendTo(wrapper); //.hide();
            children.appendTo(wrapper);
        }
        return wrapper;
    }

    function activeLink(link, causesTransition) {
        //isInTransition = link != null && causesTransition != false;
        mobile.activeLink(link);
    }

    function higlightButton(button) {
        activeLink(button);
        setTimeout(function () {
            activeLink();
        }, 200);
    }

    function callWithFeedback(link, method) {
        link = $(link);
        if (link.is('.app-btn-more')) {
            link.addClass('ui-btn-active');
            setTimeout(function () {
                link.removeClass('ui-btn-active');
                feedbackFrom = 'link';
                method();
            }, feedbackTimeout);
        }
        else {
            activeLink(link);
            setTimeout(function () {
                activeLink();
                feedbackFrom = 'link';
                if (link)
                    if (link.is('.app-btn'))
                        feedbackFrom = 'toolbar';
                method();
            }, feedbackTimeout);
        }
    }

    function trimContentStub(scrollable, stub) {
        if (!stub)
            stub = scrollable.find('.app-stub,.app-stub-main');
        if (stub.length) {
            var stubTop = Math.ceil(stub.offset().top),
            //stubHeight = stub.outerHeight(true),
                scrollableTop = Math.ceil(scrollable.offset().top),
                scrollableHeight = scrollable.height();
            if (stubTop > scrollableTop)
                if (stubTop > scrollableTop + scrollableHeight)
                    stub.height('');
                else
                    stub.height(scrollableHeight - (stubTop - scrollableTop) /* - cssUnitsToNumber(stub.css('margin-bottom'))*/);
        }
    }

    function halt() {
        hideHeadingBar();
        mobile.promo(false);
        $body.find('> *').hide();
    }

    function userActivity() {
        if (membership)
            membership._updateLastActivity();
    }

    function enableHeading() {
        $mobile.activePage.find('.dv-heading').removeClass('app-disabled')
    }

    function contextSidebar() {
        if (!sidebarElement)
            sidebarElement = $('#app-sidebar');
        return sidebarElement;
    }

    function contextSidebarIsVisible() {
        return contextSidebar().is(':visible');
    }

    function clearPassiveCalculateTimeout(resetOldValue) {
        if (passiveCalculateTimeout) {
            clearTimeout(passiveCalculateTimeout);
            passiveCalculateTimeout = null;
        }
        if (resetOldValue)
            passiveCalculateOldValue = null;
    }

    function callAfterCalculate(callback) {
        if (afterCalculateRetryInterval)
            return true;
        if (mobile.causesCalculate()) {
            afterCalculateRetryInterval = setInterval(function () {
                if (!mobile.causesCalculate()) {
                    clearInterval(afterCalculateRetryInterval);
                    afterCalculateRetryInterval = null;
                    callback();
                }
            }, 100);
            return true;
        }
        return false;
    }

    function executeContextAction(item, link) {
        //hideHeadingBar();
        if (item) {
            if (!callAfterCalculate(function () {
                executeContextAction(item, link);
            }))
                if (item.callback)
                    item.callback(item.context, link);
                else if (item.href)
                    _window.location.href = item.href;

        }
    }

    function transitionStatus(inProgress) {
        var activePage = $mobile.activePage;
        if (activePage)
            activePage.find('.dv-load-at-top').css('visibility', inProgress ? 'hidden' : '');
        isInTransition = inProgress;
    }

    function getActivePageId() {
        var activePage = $mobile.activePage;
        return activePage ? activePage.attr('id') : '_';
    }

    function advancedSearchPageIsActive() {
        return getActivePageId() == 'advanced-search';
    }

    function dateToHtmlString(d) {
        return d ? d.toJSON().slice(0, 10) : null;
    }

    function dateTimeToHtmlString(d) {
        return d ? new Date(d.getTime() - d.getTimezoneOffset() * 60 * 1000).toJSON().slice(0, 19) : null;
    }

    function htmlStringToDate(s) {
        return s ? htmlStringToDateTime(s + 'T00:00:00') : null;
    }

    function htmlStringToDateTime(s) {
        var d = s ? new Date(s.substring(0, 4), parseInt(s.substring(5, 7)) - 1, s.substring(8, 10), s.substring(11, 13), s.substring(14, 16), 0, 0) : null;
        if (d != null)
            d = new Date(d.getTime() - d.getTimezoneOffset() * 60 * 1000);
        return d;
        //return d != null ? new Date(d.getTime() + d.getTimezoneOffset() * 60 * 1000) : null;
    }

    function yardstick(listview) {
        var elementWidth = 16,
            displayDensity = settings.displayDensity;
        if (displayDensity == 'Compact')
            elementWidth == 14;
        else if (displayDensity == 'Condensed')
            elementWidth = 12;
        $(listview || $mobile.activePage.find('.app-listview')).each(function () {
            var view = $(this),
                viewParent = view.parent(),
                page = view.closest('.ui-page'), pageDisplay,
                id = 'w' + Math.ceil(($window.width() - (contextSidebarIsVisible() ? contextSidebar().outerWidth() : 0)) / elementWidth / 5) * 5,
                data = yardstickData[id],
                firstItem, cardItemWidth, listItemWidth, firstGridSpan, gridColumnPadding,
                widthClass = 'app-width',
                lastWidthClass = view.attr('data-yardstick-class'),
                testListView = $body.find('#app-yardstick'),
                isGrid = view.is('.app-grid'),
                isEcho = viewParent.is('.app-echo-inner'),
                isEchoOrMap = isEcho || viewParent.is('.app-map-info');

            if (!data && !isEchoOrMap || isEcho && isGrid) {
                if (!testListView.length)
                    testListView = $('<ul id="app-yardstick" class="app-listview"><li class="dv-item"><a><span>1</span></a></li><li><a class="dv-item">2</a></li><li><a class="dv-item">3</a></li></ul>').appendTo($body).listview();
                if (isEcho && isGrid)
                    viewParent = viewParent.closest('.app-wrapper');
                testListView.appendTo(viewParent).show();
                firstItem = testListView.find('li:first');

                pageDisplay = page.css('display');
                if (pageDisplay != 'block')
                    page.css('display', 'block');

                listItemWidth = firstItem.outerWidth();

                testListView.addClass('app-cardview');
                cardItemWidth = firstItem.outerWidth();
                testListView.removeClass('app-cardview');

                testListView.addClass('app-grid');
                firstGridSpan = firstSpanPadding = testListView.find('span:first');
                gridColumnPadding = parseInt(firstGridSpan.css('margin-left').replace('px', '')); // firstGridSpan.outerWidth() - firstGridSpan.width();
                testListView.removeClass('app-grid');

                if (pageDisplay != 'block')
                    page.css('display', '');

                testListView.appendTo($body).hide();
                data = { card: Math.ceil(cardItemWidth / elementWidth / 5) * 5, list: Math.ceil(listItemWidth / elementWidth / 5) * 5, columnPadding: gridColumnPadding, grid: {} };
                yardstickData[id] = data;
            }
            widthClass += !isGrid && isEchoOrMap ? Math.ceil(view.width() / elementWidth / 5) * 5 : (view.is('.app-cardview') ? data.card : data.list);
            if (widthClass != lastWidthClass) {
                if (lastWidthClass)
                    view.removeClass(lastWidthClass);
                view.addClass('app-yardstick ' + widthClass).attr('data-yardstick-class', widthClass);
            }
            if (isGrid) {
                var pageInfo = mobile.pageInfo(isEcho ? view.closest('.app-echo').attr('data-for') : page.attr('id')),
                    gridClassSet = pageInfo.id + '_' + pageInfo.dataView._viewId;
                if (!data.grid[gridClassSet]) {
                    data.grid[gridClassSet] = true;
                    var dataView = pageInfo.dataView,
                        fields = dataView._fields,
                        allFields = dataView._allFields,
                        fieldList = [],
                        columns, priority, maxPriority = 3,
                        totalColumns = 0,
                        availWidth = data.list * elementWidth,
                        minColumnWidth = 4 * elementWidth + data.columnPadding,
                        c,
                        css = new Sys.StringBuilder();
                    $(fields).each(function (index) {
                        var originalField = this,
                            field = allFields[this.AliasIndex];

                        if (!originalField.Hidden && !originalField.OnDemand) {
                            columns = field.Columns;
                            if (field.ItemsStyle == 'CheckBoxList')
                                columns = 80;
                            else if (columns > 80)
                                columns = 80;
                            else if (!columns)
                                if (field.Type == 'String') {
                                    columns = 30;
                                    if (field.Len > 0 && field.Len < columns)
                                        columns = field.Len;
                                }
                                else
                                    columns = 15;
                            totalColumns += columns;
                            priority = 0;
                            if (originalField.tagged('item-aside'))
                                priority = 1;
                            else if (originalField.tagged('item-count'))
                                priority = 2;
                            else {
                                if (originalField.tagged('item-para'))
                                    maxPriority++;
                                if (originalField.tagged('item-desc'))
                                    priority = maxPriority;
                                else
                                    priority = 100;
                            }

                            fieldList.push({ className: String.format('gc_{0}_{1}_{2}', dataView._id, dataView._viewId, field.Name), cols: columns, priority: priority, type: field.Type });
                        }
                    });
                    var firstField = fieldList[0],
                        originalFirstFieldCols = firstField.cols,
                        effectiveTotalColumns,
                        sb, continuePriorityProbing = true,
                        numberOfVisibleFields = 0,
                        hasKey = dataView._hasKey();

                    fieldList.reverse()

                    firstField.priority = 0;

                    function ensureMinimalColsOfFieldField(skipReset) {
                        totalColumns -= firstField.cols - originalFirstFieldCols
                        firstField.cols = originalFirstFieldCols;
                        if (firstField.cols / totalColumns * availWidth < minColumnWidth) {
                            firstField.cols = Math.floor(minColumnWidth / availWidth * totalColumns);
                            totalColumns += firstField.cols - originalFirstFieldCols;
                        }
                    }

                    ensureMinimalColsOfFieldField();

                    function eliminateFields(priority) {
                        $(fieldList).each(function (index) {
                            c = this;
                            if (!c.hidden) {
                                c.width = c.cols / totalColumns * availWidth;
                                if (c.width < minColumnWidth) {
                                    var i = 0;
                                    while (i < index && c.priority > 1 || i < fieldList.length && c.priority < 2) {
                                        var c2 = fieldList[i++]
                                        if (c != c2 && !c2.hidden && c2.priority >= c.priority && c2.priority > 1) {
                                            c2.hidden = true;
                                            continuePriorityProbing = true;
                                            totalColumns -= c2.cols;
                                            //ensureMinimalColsOfFieldField();
                                            return false;
                                        }
                                    }
                                    if (c.priority > 1) {
                                        c.hidden = true;
                                        totalColumns -= c.cols;
                                        //ensureMinimalColsOfFieldField();
                                    }
                                }
                            }
                        });
                    }

                    while (continuePriorityProbing) {
                        continuePriorityProbing = false;
                        eliminateFields();
                    }
                    $(fieldList).each(function () {
                        if (!this.hidden)
                            numberOfVisibleFields++;
                    });
                    if (numberOfVisibleFields < 2 && fieldList.length > 0) {
                        ensureMinimalColsOfFieldField();
                        $(fieldList.reverse()).each(function () {
                            c = this;
                            if (c.hidden) {
                                c.hidden = false;
                                totalColumns += c.cols;
                                return false;
                            }
                        });
                    }
                    effectiveTotalColumns = totalColumns;

                    // create css rules
                    availWidth -= isEcho ? 32 : 16;
                    $(fieldList).each(function (index) {
                        c = this;
                        if (c.hidden)
                            css.appendFormat('.app-grid.app-width{0} .{1}, .app-grid-header.app-width{0} .{1} {{display:none!important;}}', data.list, c.className);
                        else
                            css.appendFormat('.app-grid.app-width{0} .{1}, .app-grid-header.app-width{0} .{1} {{width:{2}%;}}', data.list, c.className, (c.cols / effectiveTotalColumns - data.columnPadding / availWidth - (c == firstField && hasKey ? (22 / availWidth) : 0)) * 100); // 22 is the width of "app-first::after" element, minus margin
                        css.appendLine();
                    });
                    sb = css.toString();
                    $('<style>').appendTo($('head')).text(sb);
                }
            }
            view.find('li.app-yardstick').each(function () {
                var item = $(this);
                widthClass = 'app-width' + data.list;
                lastWidthClass = item.attr('data-yardstick-class');
                if (widthClass != lastWidthClass) {
                    if (lastWidthClass)
                        item.removeClass(lastWidthClass);
                    item.addClass(widthClass).attr('data-yardstick-class', widthClass);
                }
            });
        });
    }

    function highlightSelection() {
        var pageInfo = mobile.pageInfo();
        if (!pageInfo)
            return;
        var dataView = pageInfo.dataView,
            extension = dataView && dataView.extension();
        if (extension && dataView.get_isGrid()) {
            skipInfoView = true;
            extension.executeInContext('Eye', null, false);
        }
    }

    function addRwd(element, width) {
        if (width)
            element.addClass('app-width' + width);
        return element;
    }

    function busyIndicator(show) {
        var menuButton = mobile._menuButton;
        if (arguments.length == 0)
            return menuButton.is('.' + transitionClasses);
        if (menuButton && mobile.toolbar().is(':visible')) {
            if (show == 'off')
                menuButton.removeClass(transitionClasses);
            else if (show)
                menuButton.addClass(transitionClasses);
            else
                setTimeout(function () {
                    menuButton.removeClass(transitionClasses);
                }, 500);
        }
    }

    function busyBeforeUnload() {
        busyIndicator(true);
        $window.one('beforeunload pagehide', function () {
            busyIndicator(false);
        });
    }

    function waitForDataView(dataView) {
        // this creates conflicts - sometimes animation remaind pending
        //setTimeout(function () {
        //    busyIndicator(true);
        //    var busyInterval = setInterval(function () {
        //        if (!dataView._busy())
        //            busyIndicator(false);
        //        clearInterval(busyInterval);
        //    }, 250);
        //}, 100);
    }

    function updateMenuButtonStatus() {
        var menuButton = mobile._menuButton,
            toolbar,
            activePageId/*,
            isContentPage = $mobile.activePage.attr('data-content-framework')*/;
        if (menuButton && mobile.toolbar().is(':visible')) {
            toolbar = mobile.toolbar();
            activePageId = getActivePageId();
            if (activePageId == 'Main' || mobile._pages.length && activePageId == mobile._pages[0].id && mobile._pages[0].home) {
                menuButton.removeClass('ui-icon-back ui-icon-bars ' + transitionClasses).addClass('ui-icon-bars').attr({ href: '#app-btn-menu', title: resourcesMobile.Menu });
                toolbar.removeClass('app-has-history');
            }
            else {
                menuButton.removeClass('ui-icon-bars ' + transitionClasses).addClass('ui-icon-back').attr({ href: '#app-back', title: resourcesMobile.Back });
                toolbar.addClass('app-has-history');
            }
        }
    }

    function savePanelScrollTop(panel) {
        if (panel.length)
            contextPanelScrolling[getActivePageId() + '_' + panel.attr('id')] = panel.find('.ui-panel-inner').scrollTop();
    }

    function restorePanelScrollTop(panel) {
        if (panel.length)
            panel.find('.ui-panel-inner').scrollTop(contextPanelScrolling[getActivePageId() + '_' + panel.attr('id')] || 0);
    }

    function createGridHeader(dataView, item) {
        var fields = dataView._fields,
            allFields = dataView._allFields,
            first = true;
        if (!item.is(':empty'))
            item.wrapInner('<span class="app-grid-desc"/>');
        var gridHeaderContainer = $('<div class="app-grid-header"/>').appendTo(item);
        $(fields).each(function () {
            var originalField = this,
                field = allFields[originalField.AliasIndex],
                columnHeading,
                sortOrder, filterFunc,
                fieldFilter, originalFilter, indicator, indicatorTitle, newIndicatorTitle;
            if (!originalField.Hidden && !originalField.OnDemand) {
                columnHeading = $('<span></span>').addClass(String.format('gc_{0}_{1}_{2}', dataView._id, dataView._viewId, field.Name))
                    .text(field.HeaderText).attr('title', field.HeaderText).attr('data-field-name', field.Name)
                    .appendTo(gridHeaderContainer);
                sortOrder = sortExpression(dataView, field.Name);
                filterFunc = dataView.get_fieldFilter(field, true);
                if (sortOrder) {
                    indicator = $('<span class="app-icon app-indicator"></span>').appendTo(columnHeading).attr('title', fieldSortOrderText(field, sortOrder));
                    if (sortOrder.toLowerCase() == 'asc') {
                        columnHeading.addClass(filterFunc ? 'app-filter-asc' : 'app-sort-asc');
                    }
                    else
                        columnHeading.addClass(filterFunc ? 'app-filter-desc' : 'app-sort-desc');
                }
                else if (filterFunc) {
                    indicator = $('<span class="app-icon app-indicator"></span>').appendTo(columnHeading);
                    columnHeading.addClass('app-filter-on');
                }
                if (filterFunc) {
                    $(dataView._filter).each(function () {
                        var ff = this;
                        if (ff.startsWith(field.Name + ':')) {
                            fieldFilter = ff;
                            return false;
                        }
                    });
                    if (fieldFilter && isDesktop()) {
                        originalFilter = dataView._filter;
                        dataView._filter = [fieldFilter];
                        indicatorTitle = indicator.attr('title');
                        newIndicatorTitle = dataView.extension().filterStatus(true);
                        if (indicatorTitle && newIndicatorTitle.match(/\.\s*$/))
                            newIndicatorTitle += ' ' + indicatorTitle + '.';
                        indicator.attr('title', newIndicatorTitle);
                        dataView._filter = originalFilter;
                    }
                }
                if (first) {
                    first = false;
                    appendMoreButton(dataView, gridHeaderContainer);
                }
            }
        });
    }

    function createRowMarkup(dataView, row, rowNumber, link, rowLabels) {
        var fields = dataView._fields,
            allFields = dataView._allFields,
            fieldLabel;
        $(fields).each(function (index) {
            var originalField = this,
                field = allFields[originalField.AliasIndex],
                fieldClass = field.itemColumnClass || String.format('gc_{0}_{1}_{2}', dataView._id, dataView._viewId, field.Name),
                span = $('<span></span>').appendTo(link).addClass(fieldClass + ' app-field app-field-' + field.Name),
                v;
            if (!originalField.Hidden && !originalField.OnDemand) {
                if (!field.itemColumnClass)
                    field.itemColumnClass = fieldClass;
                v = row[field.Index];
                v = field.text(v, false);
                if (index == 0) {
                    if (rowNumber != null)
                        v = String.format('{0}. {1}', rowNumber, v);
                    appendMoreButton(dataView, link);
                }
                if (rowLabels) {
                    fieldLabel = rowLabels ? rowLabels[index] : null;
                    if (fieldLabel) {
                        v = row[originalField.Index];
                        v = String.localeFormat(originalField.DataFormatString || '{0:n0}', v);
                        span.text(v);
                        $('<div class="app-static-text"></div>').text(fieldLabel).insertBefore(span.contents());
                        span.attr('title', field.HeaderText + '\n' + fieldLabel + ' ' + v);
                    }
                }
                else {
                    if (field.HtmlEncode)
                        span.text(v);
                    else
                        span.html(v);
                    span.attr('title', v);
                }
            }
        })
    }

    function createCardMarkup(dataView, row, map, rowNumber, item, link) {
        var allFields = dataView._allFields,
            isLink = link.is('a'),
            heading = $('<h3>').appendTo(link),
            headingField = allFields[map.heading],
            v;
        // thumb
        if (map.thumb != null) {
            v = row[map.thumb];
            if (v && v.toString().match(/^null/))
                item.addClass('ui-li-has-thumb');
            else
                var blobHref = dataView.resolveClientUrl(dataView.get_appRootPath()),
                    blobField = allFields[map.thumb],
                    thumb = $('<img class="ui-li-thumb"/>').appendTo(link).attr({
                        src: String.format('{0}blob.ashx?{1}=t|{2}', blobHref, blobField.OnDemandHandler, v)
                    });
        }
        // heading
        v = row[map.heading];
        v = headingField.text(v);
        if (isLink)
            link.attr('title', v);
        if (headingField.HtmlEncode)
            heading.text(v);
        else
            heading.html(v);
        heading.addClass('app-field app-field-' + headingField.Name)
        if (rowNumber)
            $('<span class="app-item-number"/>').insertBefore(heading.contents()).text(rowNumber + '. ');
        // aside
        if (map.aside != null) {
            item.addClass('app-li-has-aside');
            var aside = addRwd($('<p class="ui-li-aside"/>').appendTo(link), map.asideRwd),
                asideField = allFields[map.aside];
            v = row[map.aside];
            v = asideField.text(v);
            if (asideField.HtmlEncode)
                aside.text(v);
            else
                aside.html(v);
            aside.addClass('app-field app-field-' + asideField.Name)
            if (map.asideLabel)
                addRwd($('<span class="app-item-label"/>').insertBefore(aside.contents()).text(asideField.HeaderText), map.asideLabelRwd);
        }
        // count
        if (map.count != null && (aside == null || map.desc.length)) {
            var count = addRwd($('<span class="ui-li-count"/>').appendTo(link), map.countRwd),
                countField = allFields[map.count];
            v = row[map.count];
            v = countField.text(v);
            if (countField.HtmlEncode)
                count.text(v);
            else
                count.html(v);
            count.addClass('app-field app-field-' + countField.Name)
            if (map.countLabel)
                addRwd($('<span class="app-item-label"/>').insertBefore(count.contents()).text(countField.HeaderText), map.countLabelRwd);

        }
        // descriptive fields
        if (map.desc.length) {
            var desc = $('<p class="app-para"/>').appendTo(link);
            $(map.desc).each(function (index) {
                var fieldIndex = this,
                    field = allFields[fieldIndex],
                    label = map.descLabels[index],
                    labelRwdWidth = map.descLabelsRwd[index],
                //caption = map.descCaptions[index],
                    para = map.descPara[index],
                    fieldContents,
                    headerText = field.HeaderText;
                if (para)
                    desc = $('<p class="app-para"/>').appendTo(link).insertAfter(desc);
                //else if (!caption)
                //    addRwd($('<span class="app-item-desc-divider"/>').appendTo(desc), map.descRwd[index]);
                v = row[fieldIndex];
                var span = addRwd($('<span class="app-item-desc"/>').appendTo(desc), map.descRwd[index]).addClass('app-field app-field-' + field.Name);
                v = field.text(row[fieldIndex]);
                if (field.HtmlEncode && field.TextMode != 3)
                    span.text(v);
                else
                    span.html(v);
                fieldContents = span.contents();
                if (label) {
                    addRwd($('<span class="app-item-label-before"/>').insertBefore(fieldContents.first()).text(headerText), labelRwdWidth);
                    addRwd($('<span class="app-item-label-after"/>').insertAfter(fieldContents.last()).text(headerText), labelRwdWidth);
                }
            });
        }
        if (isLink)
            appendMoreButton(dataView, link);
    }

    function createCard(dataView, listview, displayContextLabel) {
        var selector = '.app-listview li a.app-selected:first,.app-wrapper .app-map',
            dataViewId = dataView._lookupInfo ? dataView._id : dataView._parentDataViewId || dataView._id,
            selection = $('#' + dataViewId).find(selector),
            item,
            cardDataView = $app.find(dataViewId),
            dataContext, row,
            mapInfo;
        if (!selection.length) {
            selection = $('#' + dataView._id + '_echo .app-echo-inner .app-selected');
            dataViewId = dataView._id;
            cardDataView = dataView;
        }
        if (!selection.length) {
            dataViewId = dataView._filterSource;
            selection = $('#' + dataViewId).find(selector);
            cardDataView = $app.find(dataViewId);
        }
        if (selection.length) {
            item = $('<li class="app-li-card">');
            if (listview)
                item.appendTo(listview);
            if (!selection.is('.app-selected')) {
                mapInfo = selection.data('data-map');
                if (mapInfo)
                    row = cardDataView.extension().commandRow();
            }
            else {
                dataContext = selection.data('data-context')
                if (dataContext)
                    row = dataContext.row;
            }
            if (row) {
                createCardMarkup(cardDataView, row, cardDataView.extension().itemMap(), null, item, item);
                if (displayContextLabel != false) {
                    contextDataView = $app.find(dataViewId);
                    $('<span class="app-li-corner">').appendTo(item.addClass('app-li-has-corner')).text(contextDataView.get_view().Label);
                }
                if (selection.parent().is('.app-li-has-aside'))
                    item.addClass('app-li-has-aside');
            }
        }
        return item;
    }

    function pageHeaderText(text, header) {
        var lastText,
            headerPage,
            showPageHeader,
            line1, line2, t1, t2 = '';
        if (!header) {
            headerPage = $mobile.activePage;
            if (!headerPage)
                return;
            header = headerPage.find('.app-page-header');
        }
        else
            headerPage = header.closest('.ui-page');
        line1 = header.find('h1');
        line2 = header.find('h2');
        showPageHeader = headerPage.attr('data-page-header') != 'false';
        //var count = header.attr('data-count');
        if (typeof text == 'boolean') {
            if (text && showPageHeader)
                header.show();
            else {
                header.hide();
                headerPage.attr('data-page-header', 'false');
            }
        }
        else {
            lastText = header.data('data-text');
            if (text) {
                if (lastText && typeof lastText != 'string' && typeof text == 'string') {
                    lastText[1] = text;
                    text = lastText;
                }
                header.data('data-text', text);
            }
            else
                text = lastText;
            if (text)
                if (typeof text == 'string')
                    t1 = text;
                else {
                    t1 = text[0];
                    t2 = text[1];
                }
            if (header.attr('data-locked') != 'true') {
                line1.text(t1);
                line2.text(t2);
            }
            //if (count)
            //    text = String.format('{0} ({1})', text, count);
            if (text == mobile.title() || !showPageHeader) {
                header.hide();
                if (showPageHeader)
                    headerPage.attr('data-page-header', 'false');
            }
            else
                header.show();
            return text;
        }
    }

    function configurePopupListview(popup) {
        blurFocusedInput();
        var w = Math.ceil($window.width() * .9);
        if (w > 800)
            w = 800;
        popup.css({ maxWidth: w });
    }

    function startSearch(dataView, query) {
        if (query == null)
            query = _pendingQueryText;
        _pendingQueryText = null;
        var extension = dataView.extension();
        if (extension.useAdvancedSearch())
            startAdvancedSearch(dataView, query, query && 'none');
        else
            mobile.search('configure', { 'text': query || extension.quickFind(), 'placeholder': formatQuickFindPlaceholder(dataView), focus: true, scope: dataView._id, setCursor: !!query });
    }

    function switchToQuickFind(link) {
        var dataView = $app.find($('#advanced-search').attr('data-scope'));
        if (advancedSearchPageIsActive()) {
            dataView.extension().useAdvancedSearch(false);
            callWithFeedback(link, function () {
                $body.one('pagecontainershow', function () {
                    setTimeout(function () {
                        startSearch(dataView);
                    }, 200);
                });
                pageChangeCallback = null;
                history.go(-1);
            });
        }
        else
            startSearch(dataView);
    }



    function startAdvancedSearch(dataView, query, transition) {
        var filter = dataView.get_filter(),
            extension = dataView.extension(),
            content = mobile.content('advanced-search'),
            page = content.closest('.ui-page'),
            header = content.find('.app-page-header'),
            header1 = dataView.get_view().Label,
            header2 = resourcesMobile.AdvancedSearch,
            filterPanel = content.find('.app-panel-filter'),
            recent = dataView.viewProp('advancedSearchRecent'),
            config;

        function createConditionFrom(dataView, field, originalField, required) {
            var searchOptions = originalField.SearchOptions,
                filterType = field.FilterType;
            return {
                field: field.Name, originalField: originalField.Name, id: dataView._id, mappedId: dataView._mappedId, filterField: dataView._mappedId && dataView._filterFields[0],
                headerText: field.HeaderText, scopeText: dataView._mappedId && dataView.get_view().Label, filterType: filterType,
                operation: searchOptions && $app.filterDef(resourcesData.Filters[filterType].List, searchOptions[0]) && searchOptions[0] || (filterType == 'Boolean' ? '$true' : (filterType == 'Text' ? '$contains' : '=')),
                value: null, value2: null, values: [], required: required == true
            };
        }

        function enumerateConditions(kind, list, detectedRequiredFields) {
            var dataView = targetDataView(),
                fields = dataView._fields,
                allFields = dataView._allFields;
            $(fields).each(function () {
                var originalField = this,
                    field = allFields[originalField.AliasIndex],
                    searchMode = originalField.Search,
                    isRequired = searchMode == 1 && kind == 'Required',
                    isSuggested = searchMode == 2 && kind === 'Suggested',
                    isForbidden = searchMode == 4,
                    include = !kind && list.length < 3 || isRequired || isSuggested,
                    condition;
                if (field.AllowQBE && include && !isForbidden)
                    list.push(createConditionFrom(dataView, field, originalField, isRequired && detectedRequiredFields == true));
            });
        }

        function updateConditionState(condition, container) {
            var fieldSelect = container.find('.app-condition-list-field').text(condition.headerText),
                op = condition.operation,
                filterInfo = resourcesData.Filters[condition.filterType],
                filterKind = filterInfo.Kind.toLowerCase(),
                filterDef = $app.filterDef(filterInfo.List, op),
                showFirstInput = !op.match(filterWithoutInputRegex),
                showSecondInput = showFirstInput && op == '$between',
                operationSelect = container.find('.app-condition-list-operation'),
                firstInputContainer = container.find('.app-input-container:first'),
                firstInputValue = firstInputContainer.find('.app-input-value'),
                firstInputText = firstInputContainer.find('.app-input-text'),
                andWord = firstInputContainer.next(),
                secondInputContainer = andWord.next(),
                secondInputValue = secondInputContainer.find('.app-input-value'),
                secondInputText = secondInputContainer.find('.app-input-text'),
                valuesSelect = container.find('.app-condition-list-values');

            // add optional scope to the field
            if (condition.scopeText)
                $('<span/>').appendTo(fieldSelect).text(condition.scopeText);

            // set filter operation name
            operationSelect.text(filterDef.Text);
            if (op.match(/month/))
                operationSelect.addClass('app-condition-list-operation-month');
            else
                operationSelect.removeClass('app-condition-list-operation-month');

            // configure first input
            firstInputValue.text(filterKind);
            firstInputText.attr('placeholder', filterKind);

            // configure second input
            secondInputValue.text(filterKind);
            secondInputText.attr('placeholder', filterKind);

            // show/hide first and second inputs
            if (showFirstInput)
                firstInputContainer.show();
            else
                firstInputContainer.hide();
            if (showSecondInput) {
                andWord.show();
                secondInputContainer.show();
            }
            else {
                andWord.hide();
                secondInputContainer.hide();
            }
            firstInputContainer.find(':input').val(condition.value);
            secondInputContainer.find(':input').val(condition.value2);

            if (op == '$in' || op == '$notin') {
                valuesSelect.show();
                valuesSelect.text(condition.lovText || resourcesLookup.SelectLink);
                valuesSelect.addClass('app-has-children');
            }
            else
                valuesSelect.hide();

            container.data('condition', condition)
        }

        function createConditionControls(condition, list) {
            var fieldContainer = $('<li class="app-condition ui-body-a"></li>').appendTo(list),
                fieldSelect,
                inputContainer;
            // field
            fieldSelect = $('<a class="app-condition-list-field app-btn-select ui-btn ui-corner-all ui-btn-inline"/>').appendTo(fieldContainer);
            if (!condition.required || fieldContainer.closest('.app-conditions').prev().length)
                fieldSelect.addClass('app-has-children');
            // operation
            $('<a class="app-condition-list-operation app-btn-select ui-btn app-has-children ui-corner-all ui-btn-inline"/>').appendTo(fieldContainer);
            // input field
            inputContainer = $('<div class="app-input-container ui-first-child"></div>').appendTo(fieldContainer);
            $('<input type="text" class="app-input-text"/>').appendTo(inputContainer);
            $('<span class="app-input-value"/>').appendTo(inputContainer).css('visibility', 'hidden');
            // input field
            $('<span class="app-condition-and"/>').appendTo(fieldContainer).text(resourcesData.Filters.Labels.And);
            inputContainer = $('<div class="app-input-container ui-last-child"></div>').appendTo(fieldContainer);
            $('<input type="text" class="app-input-text"/>').appendTo(inputContainer);
            $('<span class="app-input-value"/>').appendTo(inputContainer).css('visibility', 'hidden');
            // list of values
            $('<a class="app-condition-list-values app-btn-select ui-btn ui-corner-all ui-btn-inline"/>').appendTo(fieldContainer);
            // "more" icon
            $('<a class="ui-btn ui-btn-icon-notext app-btn-icon-transparent app-btn-more ui-btn-right"/>').appendTo(fieldContainer).attr('title', resourcesMobile.More);
            updateConditionState(condition, fieldContainer);
            return fieldContainer;
        }

        function createMatchingGroupControls(dataView, group) {
            var list = $('<ul class="app-condition-list ui-body-a"/>').appendTo($('<div class="app-conditions"></div>').appendTo(filterPanel)).data('group', group),
                scopeContainer = $('<li class="app-matching ui-body-a"></li>').appendTo(list);
            $('<a class="app-condition-list-scope app-btn-select ui-btn app-has-children ui-corner-all ui-btn-inline"/>').appendTo(scopeContainer).text(
                resourcesMobile[group.scope]);
            $('<a class="ui-btn ui-btn-icon-notext app-btn-icon-transparent app-btn-more ui-btn-right"/>').appendTo(scopeContainer).attr('title', resourcesMobile.More);

            $(group.conditions).each(function () {
                createConditionControls(this, list);
            });
            var addConditionContainer = $('<li class="app-condition app-condition-more ui-body-a"></li>').appendTo(list);
            $('<a class="app-condition-list-field app-btn-select ui-btn ui-corner-all ui-btn-inline app-has-children"/>').appendTo(addConditionContainer).text(resourcesGrid.AddConditionText);
            if (!availableConditionFields(group).length && (targetDetailMap() || !targetDetailInfo().length))
                addConditionContainer.hide();
            return list.parent();
        }

        function createMatchGroups(config, addMatchAny, detectedRequiredFields) {
            var matchGroup = matchGroup = { scope: 'MatchAll', required: false },
                requiredConditions = [],
                suggestedConditions = [];
            enumerateConditions('Required', requiredConditions, detectedRequiredFields);
            enumerateConditions('Suggested', suggestedConditions);
            if (requiredConditions.length)
                matchGroup.conditions = requiredConditions.concat(suggestedConditions);
            else if (suggestedConditions.length)
                matchGroup.conditions = suggestedConditions;
            else {
                // automatic "all" matching group
                enumerateConditions(null, requiredConditions);
                matchGroup.conditions = requiredConditions;
                // automatic "any" matching group
                if (addMatchAny) {
                    config.push(matchGroup);
                    matchGroup = JSON.parse(JSON.stringify(matchGroup));
                    matchGroup.scope = 'MatchAny';
                }
            }
            config.push(matchGroup);
        }

        function availableConditionFields(group, include) {
            var childMap = targetDetailMap(),
                fieldList = [],
                usedFieldList = [],
                indexIndex;

            $(group.conditions).each(function () {
                usedFieldList.push(this.field + '.' + this.mappedId);
            });

            includeIndex = usedFieldList.indexOf(include);
            if (includeIndex >= 0)
                usedFieldList.splice(includeIndex, 1);

            function enumerateFields(dataView, fieldList) {
                $(dataView._fields).each(function () {
                    var originalField = this,
                        field = dataView._allFields[originalField.AliasIndex],
                        searchMode = originalField.Search,
                        isForbidden = searchMode == 4;
                    if (field.AllowQBE && !isForbidden && usedFieldList.indexOf(field.Name + '.' + dataView._mappedId) == -1 && (!dataView._mappedId || originalField.Name != dataView._filterFields[0]))
                        fieldList.push(originalField);
                });
            }
            enumerateFields(targetDataView(), fieldList);
            if (childMap) {
                fieldList._hasChildren = true;
                for (var id in childMap)
                    enumerateFields(childMap[id], fieldList);
            }
            return fieldList;
        }

        function createConditionFieldItems(fieldList, items, currentField, callback) {
            var id;
            $(fieldList).each(function () {
                var originalField = this,
                    dataView = originalField._dataView,
                    mappedId = dataView._mappedId,
                    checked;
                field = dataView._allFields[originalField.AliasIndex];
                if (fieldList._hasChildren) {
                    if (!id) {
                        items.push({ text: dataView.get_view().Label });
                        id = dataView._id || mappedId;
                    }
                    else if (mappedId && id != mappedId) {
                        items.push({ text: dataView.get_view().Label });
                        id = mappedId;
                    }
                }
                checked = currentField == field.Name + '.' + mappedId;

                items.push({ text: field.HeaderText, icon: checked ? 'check' : false, visible: checked, context: { field: field.Name, originalField: originalField.Name, id: dataView._id, mappedId: mappedId }, callback: callback });
            });
        }

        function createConditionOperationItems(condition, items, callback) {
            var dataView = conditionDataView(condition),
                field = dataView.findField(condition.field),
                originalField = dataView.findField(condition.originalField),
                searchOptions = originalField.SearchOptions,
                customOptions = searchOptions && searchOptions.length;

            function iterateList(list, items) {
                for (var i = 0; i < list.length; i++) {
                    var funcDef = list[i],
                        opFunc = funcDef && funcDef.Function,
                        checked = opFunc == condition.operation;
                    if (funcDef)
                        if (funcDef.List)
                            iterateList(funcDef.List, items);
                        else {
                            if (!customOptions || searchOptions.indexOf(opFunc) != -1)
                                items.push({ text: funcDef.Text, icon: checked ? 'check' : false, visible: checked, context: opFunc, callback: callback });
                        }
                    else
                        if (!customOptions)
                            items.push({});
                }
            }
            iterateList(resourcesData.Filters[field.FilterType].List, items);
        }

        function fetchDetailMapOnDemand(test, callback) {
            var detailInfo = targetDetailInfo(),
                requests = [];
            if (progressIndicatorInPopup().length || test == true) {
                $(detailInfo).each(function () {
                    var dv = $app.find(this.id);
                    requests.push({ Controller: dv._controller, View: dv._viewId, RequiresMetaData: true, DoesNotRequireData: true });
                });
                $app._invoke('GetPageList',
                    { requests: requests },
                    function (result) {
                        if (test == true || test()) {
                            var detailMap = {};
                            $(result).each(function (index) {
                                var r = this,
                                    childInfo = detailInfo[index],
                                    id = childInfo.id,
                                    dataView = new Web.DataView($('<div></div>').appendTo($body));
                                dataView._render = function () { };
                                r.Expressions = [];
                                dataView._servicePath = targetDataView()._servicePath;
                                dataView._controller = r.Controller;
                                dataView._viewId = r.View;
                                dataView._onGetPageComplete(r);
                                dataView._filterFields = childInfo.filterFields;
                                dataView._mappedId = id;
                                detailMap[id] = dataView;
                            });
                            targetDetailMap(detailMap);
                            callback();
                        }
                    }
                );
            }
        }

        function refreshPopupListView(popup, callback) {
            var listview = popup.find('.ui-listview'),
                doHideShow = isDesktop();
            if (doHideShow)
                listview.hide();
            items = [];
            callback(items);
            clearListView(listview);
            renderListViewOptions(listview, items, {});
            listview.listview('refresh');
            if (doHideShow)
                listview.show();
            var x = popup.data('position-options');
            popup.popup('reposition', popup.data('position-options'));
        }


        function showConditionOperations(anchor, condition, callback) {
            var items = [],
                canceled;
            if (condition.mappedId && !targetDetailMap())
                items.push({ text: resourcesHeaderFilter.Loading, icon: 'refresh', animate: true, context: {}, keepOpen: true, callback: function () { } });
            else
                createConditionOperationItems(condition, items, callback);
            showListPopup({
                anchor: anchor, items: items,
                afterclose: function () {
                    canceled = true;
                    promoteSearch();
                },
                afteropen: function () {
                    var popup = this;
                    fetchDetailMapOnDemand(
                        function () {
                            return canceled != true;
                        },
                        function () {
                            refreshPopupListView(popup, function (items) {
                                createConditionOperationItems(condition, items, callback);
                            });
                        });
                }
            });
        }

        function showConditionFields(anchor, group, currentField, callback) {
            var dataView = targetDataView(),
                detailInfo = targetDetailInfo(),
                fieldList = availableConditionFields(group, currentField),
                items = [],
                canceled;

            createConditionFieldItems(fieldList, items, currentField, callback);

            if (detailInfo.length && !targetDetailMap())
                items.push({ text: resourcesHeaderFilter.Loading, icon: 'refresh', animate: true, context: {}, keepOpen: true, callback: function () { } });

            showListPopup({
                anchor: anchor, items: items,
                afterclose: function () {
                    canceled = true;
                    promoteSearch();
                },
                afteropen: function () {
                    var popup = this;
                    fetchDetailMapOnDemand(
                        function () {
                            return canceled != true;
                        },
                        function () {
                            refreshPopupListView(popup, function (items) {
                                createConditionFieldItems(availableConditionFields(group, currentField), items, currentField, callback);
                            });
                        });
                }
            });
        }

        function targetDataView() {
            return $app.find(page.attr('data-scope'));
        }

        function targetDetailMap(value) {
            if (arguments.length == 0)
                return page.data('detail-map');
            page.data('detail-map', value);
        }

        function targetDetailInfo(dataView) {
            if (!dataView)
                dataView = targetDataView();
            var detailInfo = [];
            $(mobile._pages).each(function () {
                var page = this,
                    dv = page.dataView;
                if (dv && dv._filterSource == dataView._id)
                    detailInfo.push({ id: dv._id, filterFields: dv._filterFields.split(/,/) });
            });
            return detailInfo;
        }

        iyf();

        function scrollToGroup(groupControls) {
            var wrapper = page.find('.app-wrapper'),
                container = groupControls.closest('.app-conditions'),
                offset = container.offset();
            animatedScroll(wrapper, wrapper.scrollTop() + offset.top - (wrapper.height() - container.outerHeight()) / 2, function () {
                mobile.blink(groupControls.find('.app-matching .app-btn-select'), function () {
                    if (isDesktop())
                        groupControls.find('input:visible').first().focus();
                });
            });
        }

        function focusConditionInput(link) {
            mobile.blink(link, function () {
                if (isDesktop())
                    link.parent().find(':input:visible').first().focus();
            });
        }

        function resetMatchingGroups() {
            $app.confirm(resourcesMobile.ResetSearchConfirm, function () {
                var dv = targetDataView();
                dv.viewProp('advancedSearchConfig', null);
                startAdvancedSearch(dv, null, 'no');
            });
        }

        function renderRecent(favorites, list) {
            if (!list || !list.length) return;
            var newList = list.slice().reverse(),
                first = true;
            $(newList).each(function () {
                var searchInfo = this,
                    searchList,
                    scopeContainer;//,
                if (favorites && searchInfo.count < 5 || !favorites && searchInfo.count >= 5)
                    return;
                if (first) {
                    first = false;
                    $('<div class="app-clear-fix"></div>').appendTo(filterPanel);
                    $('<div class="app-header"></div>').appendTo(filterPanel).text(favorites ? resourcesMobile.Favorites : resourcesMobile.Recent);
                }
                searchList = $('<ul class="app-condition-list app-condition-list-history ui-body-a"/>').appendTo($('<div class="app-conditions"></div>').appendTo(filterPanel)),
                scopeContainer = $('<li class="app-condition app-condition-history ui-body-a"></li>').appendTo(searchList);//,
                //searchSelect = $('<a class="app-btn-select ui-btn ui-corner-all ui-btn-inline"/>').appendTo(scopeContainer);
                $('<div/>').appendTo(scopeContainer).text(searchInfo.date);
                $('<div/>').appendTo(scopeContainer).text(searchInfo.text);
                $('<a class="ui-btn ui-btn-icon-notext app-btn-icon-transparent app-btn-more ui-btn-right"/>').appendTo(scopeContainer).attr('title', resourcesMobile.More);
            });
        }

        function recentHistoryElements(list) {
            if (!list)
                return filterPanel.find('.app-clear-fix').nextAll().andSelf().detach();
            list.appendTo(filterPanel);
        }

        function indexOfRecent(recentList, text) {
            var result = -1;
            $(recentList).each(function (index) {
                if (this.text == text) {
                    result = index;
                    return false;
                }
            });
            return result;
        }

        function useRecentSearch(recentList, recentText, transition) {
            var searchInfo = recentList[indexOfRecent(recentList, recentText)],
                dataView = targetDataView();
            dataView.viewProp('advancedSearchConfig', searchInfo.config);
            animatedScroll($mobile.activePage.find('.app-wrapper'), 0, function () {
                startAdvancedSearch(dataView, null, transition);
            });
        }

        function conditionDataView(condition) {
            return $app.find(condition.id) || targetDetailMap()[condition.mappedId];
        }
        mobile._contextButton.show().removeClass('ui-icon-dots').addClass('ui-icon-carat-d').attr('title', resourcesGrid.HideAdvancedSearch);

        // set the scope for advanced search
        if (page.attr('data-scope') != dataView._id || page.attr('data-view') != dataView._viewId) {
            page.attr('data-scope', dataView._id);
            page.attr('data-view', dataView._viewId);
            var childMap = targetDetailMap();
            if (childMap)
                for (var id in childMap) {
                    var dv = childMap[id];
                    dv._element.remove();
                    dv.dispose();
                }
            targetDetailMap(null);
            page.find('.app-wrapper').data('scroll-top', null);
        }

        // configure page header
        header.attr('data-locked', 'false');
        pageHeaderText(header1 == mobile.title() ? [header2, ''] : [header1, header2], header);
        header.attr('data-locked', 'true');
        page.addClass('app-page-search app-page-scrollable');

        $body.one('pagecontainershow', function () {
            pageChangeCallback = function () {
                if (dataView._totalRowCount == -1)
                    dataView.sync();
            }
        });

        if (!filterPanel.length) {
            filterPanel = $('<div class="app-panel-filter"></div>').appendTo($('<div></div>').appendTo(content)).on('vclick', function (event) {
                var link = $(event.target).closest('.ui-btn'),
                    config = filterPanel.data('config');

                if (link.length)
                    mobile.callWithFeedback(link, function () {
                        if (link.is('.app-btn-more')) {
                            if (link.parent().is('.app-matching'))
                                showListPopup({
                                    anchor: link,
                                    iconPos: 'left',
                                    tolerance: 2,
                                    items: [
                                        {
                                            text: resourcesActions.Scopes.Grid.Delete.HeaderText, icon: 'trash', callback: function () {
                                                // delete a matching group
                                                var groupControls = link.closest('.app-condition-list'),
                                                    group = groupControls.data('group'),
                                                    canDelete = true;
                                                $(groupControls).find('.app-condition').each(function () {
                                                    var conditionControls = $(this),
                                                        condition = conditionControls.data('condition');
                                                    if (condition && condition.required) {
                                                        canDelete = false;
                                                        showListPopup({ anchor: conditionControls.find('.app-condition-list-field'), title: resourcesValidator.RequiredField });
                                                        return false;
                                                    }
                                                });
                                                if (canDelete) {
                                                    config.splice(config.indexOf(group), 1);
                                                    groupControls.find('.app-condition').data('condition', null);
                                                    groupControls.data('group', null).parent().remove();
                                                }
                                            }
                                        },
                                        {
                                            text: resourcesActions.Scopes.Grid.Duplicate.HeaderText, icon: 'duplicate', callback: function () {
                                                // duplicate a matching group
                                                var group = link.closest('.app-condition-list').data('group'),
                                                    groupControls,
                                                    recents = recentHistoryElements();
                                                group = JSON.parse(JSON.stringify(group));
                                                config.push(group);
                                                groupControls = createMatchingGroupControls(targetDataView(), group);
                                                filterPanel.find('.app-matching-more').closest('.app-conditions').appendTo(filterPanel);
                                                recentHistoryElements(recents);
                                                scrollToGroup(groupControls);
                                            }
                                        }
                                    ],
                                    afterclose: promoteSearch
                                });
                            else if (link.parent().is('.app-condition-history')) {
                                // display context menu of recent history
                                var dataView = targetDataView(),
                                    recentText = link.parent().find('div:last').text(),
                                    recentList = dataView.viewProp('advancedSearchRecent');
                                link.parent().addClass('app-selected');
                                showListPopup({
                                    anchor: link,
                                    iconPos: 'left',
                                    tolerance: 2,
                                    items: [
                                        {
                                            text: resourcesGrid.PerformAdvancedSearch, icon: 'search', callback: function () {
                                                // perform search using recent
                                                useRecentSearch(recentList, recentText, 'search');
                                            }
                                        },
                                        {
                                            text: resourcesActions.Scopes.Grid.Edit.HeaderText, icon: 'edit', callback: function () {
                                                // edit recent search
                                                useRecentSearch(recentList, recentText, 'no');
                                            }
                                        },
                                        {},
                                        {
                                            text: resourcesActions.Scopes.Grid.Delete.HeaderText, icon: 'trash', callback: function () {
                                                // delete recent search
                                                recentList.splice(indexOfRecent(recentList, recentText), 1);
                                                dataView.viewProp('advancedSearchRecent', recentList);
                                                var container = link.closest('.app-conditions');
                                                if (container.prev().is('.app-header') && !container.next().is('.app-conditions')) {
                                                    container.prev().remove();
                                                    container.prev().remove();
                                                }
                                                container.remove();
                                            }
                                        }
                                    ],
                                    afterclose: function () {
                                        link.parent().removeClass('app-selected');
                                        promoteSearch();
                                    }
                                });
                            }
                            else if (link.parent().is('.app-condition'))
                                showListPopup({
                                    anchor: link,
                                    iconPos: 'left',
                                    tolerance: 2,
                                    items: [
                                        {
                                            text: resourcesActions.Scopes.Grid.Delete.HeaderText, icon: 'trash', callback: function () {
                                                // delete a single condition
                                                var groupControls = link.closest('.app-condition-list'),
                                                    group = groupControls.data('group'),
                                                    conditionControls = link.parent(),
                                                    condition = conditionControls.data('condition'),
                                                    fieldLink;
                                                if (condition.required && !link.closest('.app-conditions').prev().length)
                                                    showListPopup({ anchor: conditionControls.find('.app-condition-list-field'), title: resourcesValidator.RequiredField });
                                                else {
                                                    group.conditions.splice(group.conditions.indexOf(condition), 1);
                                                    conditionControls.data('condition', null).remove();
                                                    if (groupControls.find('.app-condition').length <= 1) {
                                                        config.splice(config.indexOf(group), 1);
                                                        groupControls.data('group', null).parent().remove();
                                                    }
                                                    else if (availableConditionFields(group).length)
                                                        groupControls.find('.app-condition-more').show();
                                                }
                                            }
                                        }
                                    ],
                                    afterclose: promoteSearch
                                });
                        }
                        else if (link.is('.app-btn-select'))
                            if (link.is('.app-condition-list-scope')) {
                                // change the scope of the matching group
                                var group = link.closest('.app-condition-list').data('group');
                                function changeGroupScope(scope) {
                                    group.scope = scope;
                                    link.text(resourcesMobile[scope]);
                                }
                                showListPopup({
                                    anchor: link,
                                    iconPos: 'left',
                                    items: [
                                        { text: resourcesMobile.MatchAll, context: 'MatchAll', icon: group.scope == 'MatchAll' ? 'check' : false, callback: changeGroupScope },
                                        { text: resourcesMobile.MatchAny, context: 'MatchAny', icon: group.scope == 'MatchAny' ? 'check' : false, callback: changeGroupScope },
                                        { text: resourcesMobile.DoNotMatchAll, context: 'DoNotMatchAll', icon: group.scope == 'DoNotMatchAll' ? 'check' : false, callback: changeGroupScope },
                                        { text: resourcesMobile.DoNotMatchAny, context: 'DoNotMatchAny', icon: group.scope == 'DoNotMatchAny' ? 'check' : false, callback: changeGroupScope }
                                    ],
                                    afterclose: promoteSearch
                                });
                            }
                            else if (link.parent().is('.app-matching-more')) {
                                // create new matching group
                                function addGroup(scope) {
                                    createMatchGroups(config, false, config.length == 0);
                                    var group = config[config.length - 1],
                                        groupControls,
                                        recents = recentHistoryElements();
                                    group.scope = scope;
                                    groupControls = createMatchingGroupControls(targetDataView(), group);
                                    link.closest('.app-conditions').appendTo(filterPanel);
                                    recentHistoryElements(recents);
                                    scrollToGroup(groupControls);

                                }
                                showListPopup({
                                    anchor: link,
                                    items: [
                                        { text: resourcesMobile.MatchAll, context: 'MatchAll', callback: addGroup },
                                        { text: resourcesMobile.MatchAny, context: 'MatchAny', callback: addGroup },
                                        { text: resourcesMobile.DoNotMatchAll, context: 'DoNotMatchAll', callback: addGroup },
                                        { text: resourcesMobile.DoNotMatchAny, context: 'DoNotMatchAny', callback: addGroup }
                                    ],
                                    afterclose: promoteSearch
                                });
                            }
                            else if (link.parent().is('.app-condition-more')) {
                                // create a new condition in a matching group
                                var groupControls = link.closest('.app-condition-list'),
                                    group = groupControls.data('group');
                                showConditionFields(link, group, null, function (fieldInfo) {
                                    var dataView = conditionDataView(fieldInfo)/* $app.find(fieldInfo.id) || targetDetailMap()[fieldInfo.mappedId]*/,
                                        condition = createConditionFrom(dataView, dataView.findField(fieldInfo.field), dataView.findField(fieldInfo.originalField)),
                                        conditionControls;
                                    group.conditions.push(condition);
                                    conditionControls = createConditionControls(condition, groupControls);
                                    link.parent().appendTo(groupControls);
                                    if (availableConditionFields(group).length)
                                        link.parent().show();
                                    else
                                        link.parent().hide();
                                    focusConditionInput(conditionControls.find('.app-condition-list-field'));
                                });
                            }
                            else if (link.is('.app-condition-list-field')) {
                                // change the field of the condition
                                var groupControls = link.closest('.app-condition-list'),
                                    group = groupControls.data('group'),
                                    conditionControls = link.parent(),
                                    originalCondition = conditionControls.data('condition');

                                if (originalCondition.required && !link.closest('.app-conditions').prev().length)
                                    showListPopup({ anchor: conditionControls.find('.app-condition-list-field'), title: resourcesValidator.RequiredField });
                                else
                                    showConditionFields(link, group, originalCondition.field + '.' + originalCondition.mappedId, function (fieldInfo) {
                                        var dataView = conditionDataView(fieldInfo)/* $app.find(fieldInfo.id) || targetDetailMap()[fieldInfo.mappedId]*/,
                                            condition = createConditionFrom(dataView, dataView.findField(fieldInfo.field), dataView.findField(fieldInfo.originalField));
                                        condition.value = originalCondition.value;
                                        condition.value2 = originalCondition.value2;
                                        if ($app.filterDef(resourcesData.Filters[condition.filterType].List, originalCondition.operation))
                                            condition.operation = originalCondition.operation;

                                        group.conditions[group.conditions.indexOf(originalCondition)] = condition;
                                        updateConditionState(condition, conditionControls);
                                        focusConditionInput(link);
                                    });
                            }
                            else if (link.is('.app-condition-list-operation')) {
                                // change the operation of the condition
                                var conditionControls = link.parent(),
                                    condition = conditionControls.data('condition');
                                showConditionOperations(link, condition, function (op) {
                                    condition.operation = op;
                                    updateConditionState(condition, conditionControls);
                                    focusConditionInput(link);
                                });
                            }
                            else if (link.is('.app-condition-list-values')) {
                                // select a list of values in a popup
                                var conditionControls = link.parent(),
                                    condition = conditionControls.data('condition');

                                function changeListValues() {
                                    var dataView = conditionDataView(condition),
                                        fieldName = condition.field;
                                    showFieldValues(link, dataView, fieldName, condition.lov, function (filter) {
                                        var m = filter.match(/^\w+\:((\$\w+)\$|=)(.+)$/),
                                            field = dataView.findField(fieldName),
                                            op = condition.operation,
                                            lov,
                                            lovFunc,
                                            lovText = [];
                                        if (m) {
                                            lov = condition.lov = m[3];

                                            // evaluate and change the operation as needed
                                            lovFunc = m[1];
                                            if (lovFunc == '=')
                                                op = '=';
                                            else
                                                if (op == '$in')
                                                    if (lovFunc == '$in$') {
                                                    }
                                                    else
                                                        op = '$notin';
                                                else
                                                    if (lovFunc == '$in$') {
                                                    }
                                                    else
                                                        op = '$in';
                                            condition.operation = op;

                                            // create text representations of values
                                            if (op == '=') {
                                                condition.value = field.text(dataView.convertStringToFieldValue(field, lov));
                                                condition.lovText = null;
                                                condition.lov = null;
                                            }
                                            else {
                                                $(lov.split(/\$or\$/g)).each(function () {
                                                    var v = dataView.convertStringToFieldValue(field, this);
                                                    lovText.push(field.text(v));
                                                });
                                                condition.lovText = lovText.join(', ');
                                            }
                                        }
                                        else {
                                            condition.lov = null;
                                            condition.lovText = null;
                                        }
                                        updateConditionState(condition, conditionControls);
                                        promoteSearch();
                                    },
                                    promoteSearch);
                                }

                                if (condition.mappedId && !targetDetailMap())
                                    fetchDetailMapOnDemand(true, changeListValues);
                                else
                                    changeListValues();
                            }
                    });
            });
            filterPanel.on('change', function (event) {
                var target = $(event.target),
                    condition,
                    v;
                if (target.is('.app-input-text')) {
                    condition = target.closest('.app-condition').data('condition');
                    v = target.val();
                    if (target.parent().is('.ui-first-child'))
                        condition.value = v;
                    else
                        condition.value2 = v;
                }
            }).on('vclick', function (event) {
                var target = $(event.target);
                if (target.is('.app-condition')) {
                    target.find(':input:visible').first().focus();
                    return false;
                }
            });
            $('<div class="app-promo-filler"></div>').appendTo(content);
            $(document).on('sidebar.app', function (event, options) {
                if (advancedSearchPageIsActive()) {
                    var items = event.context;
                    items.splice(0, event.context.length);
                    items.push({ text: resourcesMobile.AdvancedSearchInstruction, isStatic: true, wrap: true });
                    items.push({});
                    items.push({ text: resourcesGrid.ResetAdvancedSearch, icon: 'refresh', callback: resetMatchingGroups });
                }
            }).on('search.app', function (event, callback) {
                mobile.promo(false);
                // enumerate matching groups
                var groups = [],
                    requiresDetailMap;
                filterPanel.find('.app-condition-list').each(function () {
                    var g = $(this).data('group');
                    if (g) {
                        groups.push(g);
                        $(g.conditions).each(function () {
                            if (this.mappedId)
                                requiresDetailMap = true;
                        });
                    }
                });
                function persistAdvancedSearchGroups() {
                    var error,
                        detailMap = targetDetailMap(),
                        dataView = targetDataView(),
                        scopeMap = {
                            MatchAll: '_match_:$all$',
                            MatchAny: '_match_:$any$',
                            DoNotMatchAll: '_donotmatch_:$all$',
                            DoNotMatchAny: '_donotmatch_:$any$'
                        },
                        filterGroups = {
                            positive: [],
                            negative: []
                        },
                        groupControls, conditionControls, errorAnchor,
                        oldFilter, newFilterStatus,
                        groupsToDelete = [],
                        conditionsToDelete = [],
                        deepSearchInfo = {},
                        matchingGroupCount = 0,
                        recentList;
                    // iterate groups and validate input
                    $(groups).each(function (groupIndex) {
                        var g = this,
                            matchingIncluded,
                            matchingConditions;
                        $(g.conditions).each(function (conditionIndex) {
                            var c = this,
                                op = c.operation,
                                filterValueRequired = !op.match(filterWithoutInputRegex),
                                v = c.value, vObj,
                                v2 = c.value2, vObj2,
                                dataView = $app.find(c.id) || c.mappedId && detailMap[c.mappedId],
                                field = dataView.findField(c.field),
                                fieldName = field.Name,
                                dv,
                                err,
                                filterValue = '';

                            function createError(text, focus, focus2) {
                                return { gIndex: groupIndex, cIndex: conditionIndex, text: text, focus: focus, focus2: focus2 };
                            }

                            if (filterValueRequired) {
                                // validate first value
                                if (String.isBlank(v)) {
                                    if (c.required)
                                        error = createError(resourcesValidator.RequiredField, true);
                                }
                                else {
                                    vObj = { NewValue: v.trim() };
                                    err = dataView._validateFieldValueFormat(field, vObj);
                                    if (err)
                                        error = createError(err, true);
                                    else
                                        filterValue = dataView.convertFieldValueToString(field, vObj.NewValue);

                                }
                                // validate second value
                                if (!error)
                                    if (op == '$between') {
                                        if (String.isBlank(v2)) {
                                            if (c.required)
                                                error = createError(resourcesValidator.RequiredField, false, true);
                                        }
                                        else {
                                            vObj2 = { NewValue: v2.trim() };
                                            err = dataView._validateFieldValueFormat(field, vObj2);
                                            if (err)
                                                error = createError(err, false, true);
                                        }
                                        if (!error && (vObj.NewValue >= vObj2.NewValue))
                                            error = createError(v2 + ' ' + resourcesInfoBar.LessThanOrEqual + ' ' + v, false, true);
                                        if (!error)
                                            filterValue += '$and$' + dataView.convertFieldValueToString(field, vObj2.NewValue);

                                    }
                            }
                            else if (op == '$in' || op == '$notin') {
                                filterValue = c.lov;
                                filterValueRequired = true;
                            }
                            if (error)
                                return false;
                            else {
                                // compose filter entry
                                if (!filterValueRequired || filterValue) {
                                    if (c.mappedId) {
                                        dv = targetDetailMap()[c.mappedId];
                                        if (dv == null)
                                            return;
                                    }
                                    if (!matchingIncluded) {
                                        matchingIncluded = true;
                                        matchingConditions = g.scope.startsWith('DoesNot') ? filterGroups.negative : filterGroups.positive;
                                        matchingConditions.push(scopeMap[g.scope]);
                                        matchingGroupCount++;
                                    }
                                    if (op.match(/\$/))
                                        op += '$';
                                    if (c.mappedId) {
                                        var sb = new Sys.StringBuilder();
                                        dv._fieldNameHint = {}
                                        dv._fieldNameHint[fieldName] = c.headerText + ' (' + c.scopeText.toUpperCase() + ')';
                                        dv._renderFilterDetails(sb, [fieldName + ':' + op + filterValue], false);
                                        fieldName += ',' + dv._controller + '.' + (dv._viewId || 'grid1') + '.' + c.filterField;
                                        deepSearchInfo[fieldName.replace(/\W/g, '_') + (matchingGroupCount - 1)] = sb.toString();
                                    }
                                    matchingConditions.push(fieldName + ':' + op + filterValue);
                                }
                                else
                                    conditionsToDelete.push(c);
                            }
                        });
                        if (!matchingIncluded)
                            groupsToDelete.push(g);
                    });
                    if (error) {
                        // display error message
                        groupControls = filterPanel.find('.app-condition-list').get(error.gIndex);
                        conditionControls = $($(groupControls).find('.app-condition').get(error.cIndex));
                        if (error.focus)
                            errorAnchor = conditionControls.find('.ui-first-child .app-input-text');
                        else if (error.focus2)
                            errorAnchor = conditionControls.find('.ui-last-child .app-input-text');
                        else
                            errorAnchor = conditionControls.find('.app-condition-list-field');
                        showListPopup({
                            anchor: errorAnchor,
                            title: error.text,
                            xOffset: 8,
                            yOffset: 'bottom',
                            afterclose: function () {
                                if (errorAnchor.is(':input'))
                                    errorAnchor.focus();
                                promoteSearch();
                            }
                        });
                    }
                    else {
                        // configure advanced search filter for the view
                        dataView.viewProp('advancedSearchFilter', filterGroups.positive.concat(filterGroups.negative));
                        // compress and save matching groups
                        $(groups).each(function () {
                            var g = this;
                            $(conditionsToDelete).each(function () {
                                var index = g.conditions.indexOf(this);
                                if (index >= 0)
                                    g.conditions.splice(index, 1);
                            });
                        });
                        $(groupsToDelete).each(function () {
                            var index = groups.indexOf(this);
                            if (index >= 0)
                                groups.splice(index, 1);
                        });
                        dataView.viewProp('advancedSearchConfig', groups.length == 0 ? null : groups);
                        dataView.viewProp('deepSearchInfo', deepSearchInfo);
                        // update search history
                        if (groups.length) {
                            oldFilter = dataView._filter;
                            dataView._filter = [];
                            newFilterStatus = dataView.extension().filterStatus();
                            dataView._filter = oldFilter;
                            recentList = dataView.viewProp('advancedSearchRecent') || [];
                            $(recentList).each(function (index) {
                                var searchInfo = this;
                                if (searchInfo.text == newFilterStatus) {
                                    searchInfo.date = nowToString();
                                    searchInfo.count++;
                                    recentList.splice(index, 1);
                                    recentList.push(searchInfo);
                                    newFilterStatus = null;
                                    return false;
                                }
                            });
                            if (newFilterStatus) {
                                recentList.push({ text: newFilterStatus, date: nowToString(), count: 1, config: groups });
                                if (recentList.length > 30)
                                    recentList.splice(30, 1);
                            }
                            dataView.viewProp('advancedSearchRecent', recentList);
                        }
                        // execute search
                        callback();
                    }
                }

                if (requiresDetailMap && !targetDetailMap())
                    fetchDetailMapOnDemand(true, persistAdvancedSearchGroups);
                else
                    persistAdvancedSearchGroups();

            });
        }

        // create criteria from filter and fields
        config = dataView.viewProp('advancedSearchConfig');
        if (!config) {
            config = [];
            createMatchGroups(config, true, true);
        }

        // render filter panel
        filterPanel.data('condition', null);
        filterPanel.find('.app-condition').data('condition', null);
        filterPanel.data('config', config).find('.app-condition-list').data('group', null).parent().remove();
        filterPanel.find('.app-header,.app-clear-fix').remove();

        $(config).each(function () {
            createMatchingGroupControls(dataView, this);
        });

        // Matching group for "Add matching groups" link
        var moreList = $('<ul class="app-condition-list app-condition-list-more ui-body-a"/>').appendTo($('<div class="app-conditions"></div>').appendTo(filterPanel)),
            scopeContainer = $('<li class="app-matching app-matching-more ui-body-a"></li>').appendTo(moreList);
        $('<a class="app-condition-list-field app-btn-select app-has-children ui-btn ui-corner-all ui-btn-inline"/>').appendTo(scopeContainer).text(resourcesMobile.AddMatchingGroup);

        // render Favorites and Recent
        renderRecent(true, recent);
        renderRecent(false, recent);

        $('<div class="app-clear-fix"></div>').appendTo(filterPanel);

        // user entered text and quick find and switched to advanced search

        if (transition == 'no') {
            mobile.blink(filterPanel.find('.app-condition-list-scope'));
            return;
        }

        if (transition == 'search') {
            mobile.blink(filterPanel.find('.app-condition-list-scope'), function () {
                setTimeout(function () {
                    performAdvancedSearch(true);
                }, 500);
            });
            return;
        }

        function restoreTransition() {
            // restore transition
            if (settings.pageTransition != 'none' && query && transition != 'none') {

                var navStack = $mobile.navigate.history.stack;
                navStack[navStack.length - 1].transition = 'slidedown';
            }
            var firstInput = filterPanel.find('input:visible').first();
            if (firstInput.length) {
                if (query && !firstInput.val().length) {
                    firstInput.val(query);
                    firstInput.closest('.app-condition').data('condition').value = query;
                }
                if (isDesktop()) {
                    inputCaretPos(firstInput, firstInput.val().length);
                    firstInput.focus();
                }
            };
        }

        $body.one('pagecontainershow', function () {
            setTimeout(restoreTransition, 200);
        });

        resetInvisiblePageHeight(page);
        $mobile.changePage('#advanced-search', {
            changeHash: true, transition: settings.pageTransition == 'none' ? 'none' : (transition || 'slidedown')
        });
    }

    function performAdvancedSearch(feedback) {
        if (feedback)
            callWithFeedback(mobile.promo(), function () {
                performAdvancedSearch();
            });
        else
            $(document).trigger('search.app', function () {
                var page = $('#advanced-search'),
                    dataView = $app.find(page.attr('data-scope')),
                    navStack = $mobile.navigate.history.stack;
                // go back and refresh the current data view
                navStack[navStack.length - 1].transition = 'none';
                $body.one('pagecontainershow', function () {
                    restoreScrolling($mobile.activePage);
                    applyDataFilter(dataView);
                });
                // restore transition
                pageChangeCallback = null;
                history.go(-1);
            });
    }

    function taskAssistant(dataView, content) {
        var context = [],
            page,
            navbar, tabs,
            pageInfo = mobile.pageInfo(dataView && dataView._id),
            dedicatedPage = !dataView,
            taskList, cardItem,
            separateTasksFromNavigation = false,
            mode, modeIcon = 'eye';


        function createTaskList() {
            if (dedicatedPage || context.length > 0 && !dataView.get_useCase()) {
                if (dedicatedPage)
                    content.parent().addClass('app-page-tasks');
                taskList = $('<ul data-role="listview" data-inset="true" data-shadow="false" class="app-listview app-listview-static"/>').appendTo(content);
                if (dataView)
                    cardItem = createCard(dataView, taskList, dedicatedPage);
            }
        }

        function createSettingsOption() {
            if (dedicatedPage) {
                if (context.length)
                    context.push({});
                context.push({
                    text: resourcesMobile.Settings, icon: 'gear', callback: function () {
                        mobile.contextScope('_taskAssistant');
                        configureSettings();
                    }
                });
            }
        }

        if (!dataView)
            dataView = pageInfo && pageInfo.dataView;
        if (!content) {
            content = mobile.content('taskassistant');
            page = content.closest('.ui-page');
            page.find('.app-page-header').remove();
            page.addClass('app-page-tasks app-page-scrollable');
            content.find('ul[data-role="listview"]').listview('destroy').remove();
            mobile.tabs('destroy', { container: page });
            resetInvisiblePageHeight(page);
        }
        // render context links
        if (dataView) {
            mobile.contextScope(dataView._id);
            mobile.navContext(context, !dedicatedPage);
            mobile.contextScope(null);
            if (context.length && context[0].icon == 'back')
                context = context.splice(1);
            createTaskList();
            if (dedicatedPage) {
                if (dataView.get_isInserting()) {
                    mode = 'Entering';
                    modeIcon = 'plus'
                }
                else if (dataView.get_isEditing()) {
                    mode = 'Editing';
                    modeIcon = 'edit';
                }
                else if (dataView._lookupInfo)
                    mode = 'Lookup';
            }
            if (false/*!dedicatedPage || !mode*/)
                mobile.renderContext(taskList, context, function (option) {
                    var allow = option.navigateTo == 'detail';
                    if (allow)
                        separateTasksFromNavigation = true;
                    return allow;
                });
            if (dedicatedPage) {
                if (separateTasksFromNavigation)
                    $('<li data-role="list-divider">').appendTo(taskList);
                var resumeItem = $('<li>').appendTo(taskList).attr('data-icon', modeIcon);
                resumeLink = $('<a href="#"/>').appendTo(resumeItem).text(resourcesMobile['Resume' + (mode || (dataView.get_isForm() ? 'Viewing' : 'Browsing'))]);
                $('<p class="app-item-desc"/>').appendTo(resumeLink).text(pageInfo.text);

                createSettingsOption();

                separateTasksFromNavigation = true;
                mobile.renderContext(taskList, context, function (option) {
                    if (separateTasksFromNavigation) {
                        separateTasksFromNavigation = false;
                        $('<li data-role="list-divider"/>').appendTo(taskList);
                    }
                    return !option.navigateTo && (option.callback || option.href) && option.icon != 'dots' && (!option.command || !option.command.match(/^(Eye|SideBar)$/));
                });
            }
            if (taskList) {
                // render placeholder for child data views
                if (!dedicatedPage) {
                    var tabs = [],
                        tabbedContainer;


                    function createTabStrip() {
                        mobile.tabs('create', {
                            tabs: tabs, className: 'app-tabs-echo', change: function () {
                                fetchEchos();
                            }
                        });
                    }

                    $(context).each(function () {
                        var option = this,
                            t, activator;
                        if (option.navigateTo == 'detail') {
                            activator = option.activator;
                            if (activator && activator.type == 'Tab') {
                                $(tabs).each(function () {
                                    if (activator.text == this.text) {
                                        t = this;
                                        return false;
                                    }
                                });
                                if (!t) {
                                    if (tabbedContainer != activator.container) {
                                        if (tabbedContainer) {
                                            createTabStrip();
                                            tabs = [];
                                        }
                                        tabbedContainer = activator.container;
                                    }
                                    t = { text: activator.text, content: [] };
                                    tabs.push(t);
                                }
                            }
                            echo = createEcho(this.context, taskList.parent());
                            if (t)
                                t.content.push(echo);
                        }
                    });
                    if (tabbedContainer)
                        createTabStrip();
                    //mobile.tabs('create', {
                    //    tabs: tabs, className: 'app-tabs-echo', change: function () {
                    //        fetchEchos();
                    //    }
                    //});
                }

            }
        }
        if (dedicatedPage && !dataView) {
            createSettingsOption();
            createTaskList();
            mobile.renderContext(taskList, context);
        }
        // bind event handlers for tasks
        if (taskList) {
            taskList.listview().on('vclick', function (event) {
                blurFocusedInput();
                var link = $(event.target).closest('a').andSelf('a'),
                    action = link.data('context-action'),
                    stack = $mobile.navigate.history.stack;
                if (link.length && !isDeveloperEvent(event))
                    callWithFeedback(link, function () {
                        if (getActivePageId() == 'taskassistant') {
                            //pageChangeCallback = function () {
                            //}
                            stack[stack.length - 1].transition = 'none';
                            $body.one('pagecontainershow', function () {
                                restoreScrolling($mobile.activePage);
                                setTimeout(function () {
                                    executeContextAction(action);
                                }, 100);
                            });
                            history.go(-1);
                        }
                        else
                            executeContextAction(action);
                    });
                return false;
            });
            taskList.find('.ui-btn-icon-right').toggleClass('ui-btn-icon-right ui-btn-icon-left');
            yardstick(taskList);
        }

        // create tabs for task assistant
        if (dedicatedPage && taskList && taskList.find('li:first').length) {
            var tabs = [
                { text: resourcesMenu.Tasks, content: $('#taskassistant ul[data-role="listview"]') },
                { text: resourcesMobile.Recent, content: $() },
                { text: resourcesMobile.Favorites, content: $() }
            ];
            mobile.tabs('create', { tabs: tabs, className: 'ui-header-fixed app-tabs-tasks', id: 'tasks', placeholder: content });

            $mobile.changePage('#taskassistant', {
                changeHash: true, transition: settings.pageTransition == 'none' ? 'none' : 'slidedown'
            });
        }
        if (!dedicatedPage && cardItem && !cardItem.next().length)
            taskList.off().listview('destroy').remove();

    }

    function disposeListViews(content) {
        content.find('a').data('data-context', null);
        content.find('ul[data-role="listview"]').listview('destroy').remove();
    }

    function createEcho(id, container) {
        var echo = $('<div class="app-echo"/>').appendTo(container).attr({ 'id': id + '_echo', 'data-for': id }),
            inner,
            toolbar = $(
                '<div class="app-echo-toolbar">' +
                    '<h3></h3>' +
                    '<a href="#" class="ui-btn ui-btn-inline ui-corner-all ui-icon-dots ui-btn-icon-notext app-btn-more"/>' +
                    '<div class="app-echo-controls"></div>' +
                    '<span class="app-echo-see-all">' +
                        '<span></span>' +
                        '<a href="#" class="ui-btn ui-btn-inline ui-corner-all ui-icon-carat-r ui-btn-icon-notext"/>' +
                    '</span>' +
                '</div>').appendTo(echo).on('vclick', 'a', function (event) {
                    var link = $(event.target);
                    if (clickable(link) && !mobile.busy())
                        callWithFeedback(link, function () {
                            if (link.is('.ui-icon-carat-r'))
                                mobile.changePage(id);
                            else if (link.is('.ui-icon-dots')) {
                                mobile.showContextMenu({
                                    scope: id
                                });
                            }
                        });
                    return false;
                });
        toolbar.find('.ui-icon-dots').attr('title', resourcesMobile.More).css('visibility', 'hidden');
        toolbar.find('h3').on('vclick', function (event) {
            var link = $(event.target).closest('h3'),
                options = [],
                oldScope = mobile.contextScope();
            link.addClass('app-selected');
            callWithFeedback(link, function () {
                mobile.contextScope(id);
                enumerateViewOptions(options, false);
                mobile.contextScope(oldScope);
                showListPopup({ anchor: link, items: options, iconPos: 'left', y: link.offset().top + link.outerHeight() });
            });
        });
        toolbar.find('.ui-icon-carat-r').attr('title', resourcesMobile.SeeAll);
        toolbar.find('.app-echo-see-all span').html(resourcesMobile.SeeAll).on('vclick', function (event) {
            var link = $(event.target).addClass('app-selected');
            setTimeout(function () {
                link.removeClass('app-selected');
                mobile.changePage(id)
            }, feedbackTimeout);

        });
        toolbar.find('.app-echo-controls').on('vclick', '.ui-btn', function (event, feedback) {
            var link = $(event.target).closest('a'),
                option = link.data('data-context');

            function buttonClicked() {
                var group = option.context && option.context.group,
                    context = [],
                    dataView;
                if (group) {
                    dataView = mobile.pageInfo(id).dataView;
                    enumerateActions(group.Id, dataView, context, dataView.extension().commandRow());
                    showListPopup({ items: context, anchor: link, iconPos: 'left', defaultIcon: 'carat-r', scope: dataView._id });
                }
                else
                    option.callback();
            }

            if (link.length && !mobile.busy())
                if (feedback != false)
                    mobile.callWithFeedback(link, buttonClicked);
                else {
                    buttonClicked();
                }
            return false;
        });
        $('<div class="app-echo-instruction"></div>').appendTo(echo).hide();
        inner = $('<div class="app-echo-inner"></div>').appendTo(echo).hide().on('vclick taphold', function (event) {
            var target = $(event.target),
                link = target.closest('a'),
                pageInfo,
                dataView, extension,
                dataContext,
                eventType = event.type,
                isClick = eventType != 'taphold' && !event.ctrlKey,
                isSeeAll = link.is('.dv-action-see-all'),
                isSelected;
            if (link.length && !link.is('.app-divider') && clickable(target, eventType) && (!isSeeAll || isClick) && !mobile.busy())
                callWithFeedback(target, function () {
                    if (isSeeAll)
                        mobile.changePage(id);
                    else {
                        mobile.contextScope(id);
                        pageInfo = mobile.pageInfo(id);
                        dataView = pageInfo.dataView;
                        extension = dataView.extension();
                        dataContext = link.data('data-context');
                        isSelected = link.is('.app-selected');
                        if (dataView._hasKey()) {
                            echo.find('.app-echo-inner .app-selected').removeClass('app-selected');
                            if (isClick)
                                link.addClass('app-selected');
                            else
                                if (isSelected)
                                    link.removeClass('app-selected');
                                else
                                    link.addClass('app-selected');
                            mobile.dataViewUILinks(dataView).removeClass('app-selected');
                            if (isClick) {
                                extension.tap(dataContext, 'none');
                                refreshEchoToolbar(dataView, echo);
                                if (target.is('.app-btn-more'))
                                    showRowContext(target);
                                else
                                    extension.tap(dataContext);
                            }
                            else {
                                if (isSelected)
                                    extension.clearSelection();
                                else
                                    extension.tap(dataContext, 'none');
                                refreshEchoToolbar(dataView, echo);
                                if (inner.find('.app-listview.app-grid').length && !isDesktop() && target.is('span'))
                                    showToolTip(target);
                            }
                        }
                        else
                            mobile.infoView(dataView, true, dataContext.row);
                        mobile.contextScope(null);
                    }
                });
            if (!target.closest('.app-grid-header').length)
                return false;
        }).on('contextmenu', function (event) {
            return handleFieldContextMenu(mobile.pageInfo(id).dataView, event);
        });
        $('<div class="app-echo-footer"></div>').appendTo(echo);//.hide();
        adjustEchoDensity(echo);
        toolbar.find('h3').text(mobile.pageInfo(id).text);
        if (isDesktop())
            echo.find('.app-echo-inner').attr('tabindex', 0);
        return echo;
    }


    function fetchEchos(force) {
        var echo, pageId, pageInfo, echoRefreshTimeout = 0;
        if (force)
            $mobile.activePage.find('.app-echo-toolbar').each(function () {
                echo = $(this).parent();
                pageId = echo.attr('data-for');
                pageInfo = mobile.pageInfo(pageId);
                if (pageInfo.echoId && !pageInfo.dataView._busy())
                    refreshEcho(pageInfo.echoId);
            });
        else if (!(skipTap || isInTransition || touchScrolling))
            mobile.callWhenVisible('.app-echo:visible', function (echo) {
                setTimeout(function () {
                    pageId = echo.attr('data-for');
                    pageInfo = mobile.pageInfo(pageId);
                    if (pageInfo.dataView && !pageInfo.dataView._busy() && !pageInfo.dataView.get_isForm())
                        if (!pageInfo.echoInitialized) {
                            pageInfo.echoId = echo.attr('id');
                            if (mobile.pageInit(pageInfo.id, false))
                                refreshEcho(pageInfo.id + '_echo');
                        }
                        else if (pageInfo.echoChanged)
                            refreshEcho(pageInfo.echoId);
                }, echoRefreshTimeout);
                echoRefreshTimeout += 50;
            });
        $mobile.activePage.find('.app-echo-controls.app-stale').each(function () {
            var echo = $(this).closest('.app-echo'),
                id = echo.attr('id'),
                pageInfo = mobile.pageInfo(id.substring(0, id.length - 5));
            refreshEchoToolbar(pageInfo.dataView, echo);
        });

        //else
        //    alert(String.format('skipTap: {0}; isInTransition: {1}; touchScrolling: {2}', skipTap, isInTransition, touchScrolling));
    }

    function adjustEchoDensity(echo) {
        var displayDensity = settings.displayDensity;
        if (displayDensity != 'Condensed') {
            if (displayDensity == 'Comfortable' && $window.width() / 16 < 31)
                echo.addClass('app-density-compact');
            else if (displayDensity == 'Compact' && $window.width() / 14 < 31)
                echo.addClass('app-density-condensed');
        }
    }

    function refreshEcho(id) {
        if (touchScrolling)
            return;
        var echo = $('#' + id).removeClass('app-density-condensed app-density-compact'),
            scrollable = echo.parent(),
            inner = echo.find('.app-echo-inner').show(),
            footer = inner.next().hide(),
            pageId = echo.attr('data-for'),
            pageInfo = mobile.pageInfo(pageId),
            dataView = pageInfo.dataView,
            totalRowCount = dataView._totalRowCount,
            extension = dataView.extension(),
            rows = extension.visibleDataRows(0),
            map = extension.itemMap(),
            list,
            showRowNumber = dataView.get_showRowNumber() == true,
            toolbar = $(echo).find('.app-echo-toolbar'),
            controls = toolbar.find('.app-echo-controls'),
            seeAlso = toolbar.find('.app-echo-see-all'),
            title = toolbar.find('h3').empty().text(dataView.get_view().Label || pageInfo.text),
            x1, x2,
            instructionElem = inner.prev(),
            instruction = extension.instruction(false),
            scrollbarHeight,
            screenHeight = $mobile.getScreenHeight(),
            maxHeight = scrollable.height() * .55, //.618,
            lastScroll,
            maxRowCount,
            itemsPerList,
            seeAllLink,
            stub,
            selectedHorizontalOffset,
            selectedRow,
            hasSelection = dataView.get_selectedKey().length > 0,
            autoSelect,
            aggregates = extension.aggregates();

        if (!echo.is(':visible')) {
            pageInfo.echoChanged = true;
            return;
        }
        pageInfo.echoChanged = false;

        adjustEchoDensity(echo);

        if (!rows) {
            dataView.goToPage(0, true);
            extension.echoCallback = function () {
                extension.echoCallback = null;
                refreshEcho(id);
            }
            return;
        }

        if (totalRowCount) {
            $('<span> (</span>').appendTo(title);
            $('<span class="app-echo-count"></span>').appendTo(title).text(totalRowCount);
            $('<span>)</span>').appendTo(title);
            if (isDesktop())
                title.attr('title', title.text());
        }
        if (!pageInfo.echoInitialized) {
            pageInfo.echoInitialized = true;
            pageInfo.refreshed = false;
        }

        echo.css('padding-bottom', '');
        stub = scrollable.find('.app-stub,.app-stub-main');
        if (!stub.length)
            stub = $('<div></div>').appendTo(scrollable).addClass('app-stub' + (getActivePageId() == 'Main' ? '-main' : ''));
        stub.height(stub.outerHeight() + inner.outerHeight(true));

        if (instruction && (rows.length || instruction.match(/"app-filter"/)))
            instructionElem.html(instruction).show();
        else
            instructionElem.hide();

        // clear previous content
        lastScroll = inner.scrollLeft();
        disposeListViews(inner);
        inner.empty();

        // render data cards / rows
        if (!rows.length)
            $('<div class="app-echo-empty"/>').appendTo(inner.height('')).text(resourcesData.NoRecords);
        else {
            inner.removeClass('app-no-scrolling app-horizontal-scrolling');
            if (!dataView._filterSource && scrollable.find('.app-echo:visible').length == 1) {
                maxHeight = screenHeight - inner.offset().top;
                //if (isDesktop())
                maxHeight -= cssUnitsToNumber(echo.css('padding-top')) + cssUnitsToNumber(echo.css('padding-bottom'));
            }
            maxRowCount = rows.length;
            if (extension.viewStyle() == 'Grid') {
                inner.addClass('app-no-scrolling').height('');
                disposeListViews(inner);

                list = $('<ul class="app-listview app-grid" data-role="listview"/>').appendTo(inner);
                item = $('<li data-role="list-divider" class="app-list-instruction"/>').appendTo(list);
                createGridHeader(dataView, item);
                $(rows).each(function (index) {
                    var row = this,
                        rowNumber = index + 1,
                        item = $('<li data-icon="false" class="dv-item"/>').appendTo(list),
                        link = $('<a/>').appendTo(item).data('data-context', { row: this.slice(0), pageIndex: 0 });
                    createRowMarkup(dataView, row, showRowNumber ? rowNumber : null, link);
                    if (dataView.rowIsSelected(row)) {
                        selectedRow = row;
                        link.addClass('app-selected');
                    }
                    if (index == 0) {
                        list.listview();
                        maxHeight -= item.prev().outerHeight(true) + 1;
                        itemsPerList = Math.ceil(maxHeight / (item.outerHeight(true) + 1));
                        if (aggregates)
                            itemsPerList -= 2;
                    }
                    if (itemsPerList < maxRowCount && itemsPerList - 2 == index)
                        return false;
                });
                if (aggregates) {
                    item = $('<li data-icon="false" class="dv-item"/>').appendTo(list);
                    item.prev().addClass('app-followed-by-aggregates');
                    link = $('<a class="app-divider app-calculated"/>').appendTo(item);
                    createRowMarkup(dataView, aggregates, null, link, extension.aggregateLabels());
                }
                if (itemsPerList < maxRowCount || maxRowCount < totalRowCount)
                    seeAllLink = link = $('<a class="dv-action-see-all"/>').appendTo($('<li/>').appendTo(list)).text(resourcesMobile.SeeAll);
                yardstick(list.listview().listview('refresh'));
                if (seeAllLink)
                    seeAllLink.toggleClass('ui-btn-icon-right ui-btn-icon-left');
            }
            else {
                var list = $('<ul class="app-listview" data-role="listview"/>').hide().appendTo(inner),
                    item = $('<li data-icon="false"/>').appendTo(list),
                    link = $('<a/>').appendTo(item),
                    itemHeight, maxVisibleColumns,
                    aggregateLabels;
                if (aggregates) {
                    aggregateLabels = extension.aggregateLabels();
                    footer.show().empty();
                    $(dataView._fields).each(function (index) {
                        var originalField = this,
                            field = dataView._allFields[originalField.AliasIndex],
                            l = aggregateLabels[index],
                            v, a, av;
                        if (l) {
                            v = aggregates[originalField.Index];
                            v = String.localeFormat(originalField.DataFormatString || '{0:n0}', v);
                            a = $('<a class="ui-btn ui-inline app-calculated app-btn-static"/>').appendTo(footer);
                            $('<span class="app-calculated-label"/>').text(field.HeaderText).appendTo(a);
                            av = $('<span class="app-calculated-value"/>').text(v).appendTo(a);
                            $('<div class="app-static-text"/>').text(l).insertBefore(av.contents());
                            a.attr('title', field.HeaderText + '\n' + l + ' ' + v);
                        }
                    });
                    if ($mobile.activePage.find('.app-echo:visible').length == 1 && echo.prev().is('.app-page-header'))
                        maxHeight -= footer.outerHeight();

                }
                // measure height of a single list item
                createCardMarkup(dataView, rows[0], map, showRowNumber ? 1 : null, item, link);
                list.listview().show();
                itemHeight = item.outerHeight(true);
                maxVisibleColumns = Math.floor(inner.innerWidth() / item.outerWidth(true));

                itemsPerList = Math.floor(maxHeight / itemHeight);
                if (itemsPerList < 1)
                    itemsPerList = 1;
                if (maxVisibleColumns * itemsPerList >= rows.length) {
                    itemsPerList = Math.ceil(rows.length / maxVisibleColumns);
                    inner.addClass('app-no-scrolling');
                }
                if (totalRowCount > maxRowCount) {
                    maxRowCount = maxRowCount - maxRowCount % itemsPerList
                    if (maxVisibleColumns * itemsPerList >= maxRowCount)
                        inner.addClass('app-no-scrolling');
                }
                if (!inner.is('.app-no-scrolling')) {
                    inner.addClass('app-horizontal-scrolling');
                    if (isDesktop()) {
                        itemsPerList = Math.floor(maxHeight / itemHeight);
                        if (itemsPerList < 1)
                            itemsPerList = 1;
                    }
                }
                disposeListViews(inner);
                // render lists
                $(rows).each(function (index) {
                    if (index >= maxRowCount)
                        return false;
                    if (!list || index % itemsPerList == 0) {
                        list = $('<ul class="app-listview" data-role="listview"/>').appendTo(inner);
                        addSpecialClasses(dataView, list);
                    }
                    var row = this,
                        rowNumber = index + 1,
                        item = $('<li data-icon="false" class="dv-item"/>').appendTo(list),
                        link = $('<a/>').appendTo(item).data('data-context', { row: this.slice(0), pageIndex: 0 });
                    createCardMarkup(dataView, row, map, showRowNumber ? rowNumber : null, item, link);
                    if (index == maxRowCount - 1 && maxRowCount < totalRowCount) {
                        link.find('p,img,span').css('visibility', 'hidden');
                        link.addClass('dv-action-see-all').find('h3').text(resourcesMobile.SeeAll);
                        item.attr('data-icon', 'carat-r');
                    }
                    if (dataView.rowIsSelected(row)) {
                        selectedRow = row;
                        link.addClass('app-selected');
                    }
                });
                if (maxRowCount > itemsPerList) {
                    var numberOfMissingItems = itemsPerList - maxRowCount % itemsPerList;
                    if (numberOfMissingItems < itemsPerList)
                        while (numberOfMissingItems-- > 0) {
                            item = $('<li data-icon="false" class="dv-item"/>').appendTo(list),
                            link = $('<a/>').appendTo(item);
                            createCardMarkup(dataView, rows[0], map, showRowNumber ? 1 : null, item, link);
                            link.css('visibility', 'hidden');
                        }
                }
                if (itemsPerList == totalRowCount)
                    list.addClass('app-list-one-column');
                yardstick(inner.find('ul').listview());
                list = inner.find('ul:first');
                if (list.length) {
                    scrollbarHeight = inner[0].offsetHeight - inner[0].clientHeight;
                    inner.height(list.height() + scrollbarHeight + 8);
                }
                link = inner.find('.app-selected');
                if (link.length) {
                    selectedHorizontalOffset = link.offset().left - inner.offset().left + link.outerWidth();
                    if (selectedHorizontalOffset > inner.width())
                        lastScroll = selectedHorizontalOffset - link.outerWidth();
                }
                inner.scrollLeft(lastScroll);
            }
        }
        if (!echo.prev().is('.app-echo') && !echo.next().is('.app-echo'))
            echo.css('padding-bottom', 0);
        trimContentStub(scrollable, stub);
        if (hasSelection) {
            if (!selectedRow) {
                rows = extension.visibleDataRows(extension.pageIndex());
                $(rows).each(function () {
                    var row = this;
                    if (dataView.rowIsSelected(row)) {
                        selectedRow = row;
                        return false;
                    }
                });
            }
            if (!selectedRow)
                extension.clearSelection();
            else
                if (extension.commandRow() != selectedRow) {
                    extension.clearSelection();
                    extension.tap(selectedRow, 'none');
                }
        }
        else if (extension.commandRow())
            extension.clearSelection();
        if (pageInfo.echoRefreshCallback) {
            pageInfo.echoRefreshCallback();
            pageInfo.echoRefreshCallback = null;
        }
        refreshEchoToolbar(dataView, echo, hasSelection, controls, title, seeAlso);
        if (!extension._checkedAutoSelect) {
            extension._checkedAutoSelect = true;
            setTimeout(function () {
                autoSelect = extension._autoSelect;
                extension._autoSelect = null;
                if (autoSelect && !mobile.busy()) {
                    pageInfo.echoChanged = true;
                    mobile.contextScope(dataView._id);
                    extension.tap(autoSelect.row, autoSelect.action);
                    mobile.contextScope(null);
                }
            });
        }
    }

    function refreshEchoToolbar(dataView, echo, hasSelection, controls, title, seeAll) {
        if (hasSelection == null)
            hasSelection = dataView.get_selectedKey().length > 0;
        if (!controls) {
            if (!echo)
                echo = $('#' + dataView._id + '_echo');
            if (!echo.length)
                return;
            controls = echo.find('.app-echo-toolbar .app-echo-controls');
            title = controls.parent().find('h3');
            seeAll = controls.next();
        }
        var context = [],
            toolbarContext = [],
            moreButton = title.next().css('visibility', ''),
            x1 = moreButton.offset().left + moreButton.outerWidth(),
            x2 = seeAll.offset().left,
            currentScope,
            controlsLeft, controlsWidth,
            overlappedButtons = [], textButtons = [];

        function buttonIsOverlapped(button) {
            return button.offset().left + button.outerWidth() > controlsLeft + controlsWidth - 1;
        }

        if (x1 == 0 && x2 == 0)
            controls.addClass('app-stale');
        else if (x2 - x1 >= 28) {
            controls.find('.ui-btn').data('data-context', null);
            controls.hide().contents().remove();
            currentScope = mobile.contextScope();
            mobile.contextScope(dataView._id);
            //mobile.navContext(context);
            dataView.extension().context(context, ['ActionBar']);
            mobile.contextScope(currentScope);
            $(context).each(function () {
                var option = this;
                if (option.system) {
                    if (option.icon == 'search')
                        toolbarContext.push(option);
                }
                else if (option.text)
                    toolbarContext.push(option);
            });
            $(toolbarContext).each(function () {
                var option = this,
                    link = $('<a class="ui-btn"/>').appendTo(controls).data('data-context', option);
                if (option.icon == 'dots')
                    link.addClass('app-has-children ui-corner-all ui-mini').text(option.text);
                else {
                    link.addClass('ui-mini ui-btn-icon-left ui-corner-all ui-icon-' + (option.icon || 'carat-r')).attr('title', option.text);
                    if (option.icon == 'search')
                        link.toggleClass('ui-btn-icon-left ui-btn-icon-notext ui-mini ');
                        //$('<span></span>').appendTo(controls).text(option.text);
                    else
                        link.text(option.text);
                }
            });
            controlsWidth = x2 - x1 - cssUnitsToNumber(controls.css('marginRight'));
            controls.width(controlsWidth).show();
            // auto-trim toolbar buttons
            controlsLeft = controls.offset().left;
            controls.find('.ui-btn').each(function () {
                var button = $(this);
                if (button.is('.ui-btn-icon-left'))
                    textButtons.push(button);
                if (buttonIsOverlapped(button))
                    overlappedButtons.push(button);
            });
            if (overlappedButtons.length) {
                textButtons.reverse();
                while (overlappedButtons.length) {
                    var button = overlappedButtons[0],
                        overlapped = buttonIsOverlapped(button);
                    if (overlapped) {
                        if (button.is('.ui-btn-icon-left')) {
                            button.toggleClass('ui-btn-icon-notext ui-mini ui-btn-icon-left');
                            overlapped = buttonIsOverlapped(button);
                        }
                        if (overlapped) {
                            // hide any preceding button with text until this button shows up
                            $(textButtons).each(function () {
                                var textButton = this;
                                if (overlappedButtons.indexOf(textButton) == -1 && textButton.is('.ui-btn-icon-left')) {
                                    textButton.toggleClass('ui-btn-icon-notext ui-mini ui-btn-icon-left');
                                    overlapped = buttonIsOverlapped(button);
                                    if (!overlapped)
                                        return false;
                                }

                            });
                        }
                        if (overlapped) {
                            $(overlappedButtons).each(function () {
                                this.hide();
                            });
                            break;
                        }
                    }
                    overlappedButtons.splice(0, 1);
                }
            }
            // dummy button preserves the height of the toolbar
            $('<a class="ui-btn ui-btn-icon-notext ui-corner-all"/>').appendTo(controls).css('visibility', 'hidden');
        }
        else
            controls.hide();
    }

    function tapIsCanceled() {
        var result = skipTap || isInTransition;
        return result == true;
    }

    function clickable(target, eventType) {
        if (skipTap || isInTransition)
            return false;
        if (iOS || false) {
            var link = $(target).closest('a');
            if (link.data('scroll-check') == true)
                link.data('scroll-check', false);
            else {
                touchScrolling = false;
                var scrollable = link.closest('.app-wrapper,.ui-panel-inner'),
                    scrollStopTime = scrollable.data('scroll-stop-time'),
                    scrollTop = scrollable.scrollTop();
                if (scrollStopTime && (timeNow() - scrollStopTime.getTime() > 5000))
                    return true;
                link.data('scroll-check', true);
                setTimeout(function () {
                    if (!eventType)
                        eventType = 'vclick';
                    if (scrollTop == scrollable.scrollTop()) {
                        ($(target).is('.app-btn-more') ? target : link).trigger(eventType);
                    }
                    else {
                        clickable(link, eventType);
                        activeLink();
                    }
                }, 10);
                return false;
            }
        }
        return true;
    }

    function closeActivePanel(animation) {
        setTimeout(function () { $('div.ui-panel-open').panel('close', animation != true); }, feedbackTimeout);
    }

    function refreshContextSidebar(cancel, delay, callback) {
        if (!delay)
            delay = 450;
        if (contextSidebarRefreshTimeout) {
            clearTimeout(contextSidebarRefreshTimeout)
            contextSidebarRefreshTimeout = null;
        }
        if (!cancel)
            contextSidebarRefreshTimeout = setTimeout(function () {
                if (isInTransition)
                    refreshContextSidebar(cancel, 100, callback)
                else {
                    contextSidebarRefreshTimeout = null;
                    yardstick();
                    var sidebar = contextSidebar(),
                        oldScope = mobile.contextScope();
                    savePanelScrollTop(sidebar);
                    mobile.contextScope(null);
                    mobile.refreshContextMenu(sidebar);
                    mobile.contextScope(oldScope);
                    mobile.refreshMenuStrip();
                    if (callback)
                        callback();
                }
            }, delay);
    }

    function pageVariable(name, value) {
        name = location.pathname.replace(/\W/g, '_') + '_' + name;
        if (arguments.length == 1)
            return userVariable(name);
        else
            userVariable(name, value);
    }

    function userVariable(name, value) {
        if (!userScope)
            userScope = __settings.appInfo.replace(/\W/g, '_');
        name = userScope + '_' + name;
        if (arguments.length == 1) {
            if (typeof Storage != 'undefined')
                try {
                    value = localStorage[name];
                    if (value != null)
                        value = JSON.parse(value);
                    return value;
                }
                catch (ex) {
                }
            return null;
        }
        if (typeof Storage != 'undefined')
            if (value == null)
                localStorage.removeItem(name);
            else
                try {
                    localStorage[name] = JSON.stringify(value);
                }
                catch (ex) {
                    // ignore local storage errors
                    // iOS Safari will raise an exception here if PRIVATE browsing mode is enabled.
                }
    }

    /*
    function glocalUserVariable(name, value) {
    var token = 'AppFactoryUserVars';
    
    function persistVars() {
    var s = encodeURIComponent(JSON.stringify(_userVars)),
    futureDate = new Date().getDate() + 7,
    expires = new Date();
    expires.setDate(futureDate);
    s = String.format('{0}={1}; expires={2}; path=/', token, s, expires.toUTCString());
    document.cookie = s;
    }
    
    if (_userVars == null) {
    $(document.cookie.split(';')).each(function () {
    var cookie = this.trim();
    if (cookie.startsWith(token)) {
    _userVars = decodeURIComponent(cookie.substring(token.length + 1));
    try {
    _userVars = JSON.parse(_userVars);
    persistVars();
    }
    catch (ex) {
    }
    }
    });
    if (!_userVars)
    _userVars = {};
    }
    if (arguments.length == 2) {
    _userVars[name] = value;
    persistVars();
    }
    else
    return _userVars[name];
    }
    */

    function parseActivator(elem, defaultText) {
        var activator = { text: defaultText, resolved: true, description: null, type: null },
            s = elem.attr('data-activator'),
            container,
            containerId;
        if (!s) {
            var closestElem = elem.closest('div[data-activator]');
            s = closestElem.attr('data-activator');
            if (s) {
                elem = closestElem;
                container = elem.parent();
                containerId = container.attr('id');
                if (!containerId) {
                    containerId = 'aid' + autoId++;
                    container.attr('id', containerId);
                }
                activator.container = containerId;
            }
        }
        if (!s)
            s = $(elem).prev('.DataViewHeader').text();
        if (s && s != 'false') {
            var m = activatorRegex.exec(s);
            if (m) {
                activator.text = m[4] || m[2];
                activator.type = m[1];
            }
            else
                activator.text = s;
        }
        else
            activator.resolved = false;
        activator.description = elem.attr('data-activator-description');
        return activator;
    }

    function isPhoneField(field, actionable) {
        return (actionable ? field.tagged('action-call') : field.tagged('action-call', 'field-call')) || field.Name.match(phoneFieldRegex) && (!actionable || !field.tagged('action-call-disabled'));
    }

    function isEmailField(field, actionable) {
        return (actionable ? field.tagged('action-email') : field.tagged('action-email', 'field-email')) || field.Name.match(emailFieldRegex) && !(actionable || !field.tagged('action-email-disabled'));
    }

    function isUrlField(field, actionable) {
        return (actionable ? field.tagged('action-url') : field.tagged('action-url', 'field-url')) || field.Name.match(urlFieldRegex) && (!actionable || !field.tagged('action-url-disabled'));
    }

    function isLocationField(field, actionable) {
        return actionable ? field.tagged('action-location') : field.tagged('action-location', 'map-address') && !field.tagged('action-location-disabled');
    }

    function isLookupField(field) {
        var itemsStyle = field.ItemsStyle;
        return !String.isNullOrEmpty(itemsStyle) && itemsStyle != 'CheckBoxList';
    }

    function addSpecialClasses(dataView, container) {
        if (dataView.get_isTagged('thumb-person') || (dataView._controller.match(/\b(emp|acc|user|usr|person|cust)/i) && !dataView.get_isTagged('thumb-standard')))
            container.addClass('app-thumb-person');
    }

    function animatedScroll(scrollable, scrollTop, callback) {
        //scrollable.scrollTop(scrollTop);
        //if (callback)
        //    callback();
        isInTransition = true;
        scrollable.animate({ scrollTop: scrollTop }, 'swing',
            function () {
                isInTransition = false;
                if (callback)
                    callback();
            });
    }

    function getContextPanel(selector, beforeOpenCallback, options) {
        if (!options)
            options = {};
        var contextPanel = $(selector),
            position = options.position || 'right';
        blurFocusedInput();
        contextActionOnClose = null;
        if (contextPanel.length == 0) {
            contextPanel = $(String.format('<div data-position-fixed="true" data-role="panel" data-theme="a" data-display="overlay" class="ui-panel ui-panel-display-overlay ui-panel-animate ui-panel-position-{0}"><ul/></div>', position))
                .appendTo($body)
                .panel({
                    animate: enablePanelAnimation(),
                    position: position,
                    beforeopen: function () {
                        panelIsBusy = true;
                        if (clearContextScopeTimeout) {
                            clearTimeout(clearContextScopeTimeout);
                            clearContextScopeTimeout = null;
                        }
                        if (beforeOpenCallback)
                            beforeOpenCallback();
                    },
                    open: function () {
                        panelIsBusy = false;
                        activeLink();
                        if (options && options.afteropen)
                            options.afteropen();
                    },
                    beforeclose: function () {
                        panelIsBusy = true;
                        savePanelScrollTop(contextPanel);
                    },
                    close: function (event) {
                        panelIsBusy = false;
                        if (contextActionOnClose)
                            contextActionOnClose();
                        if (mobile.contextScope())
                            clearContextScopeTimeout = setTimeout(function () {
                                mobile.contextScope(null);
                                clearContextScopeTimeout = null;
                            }, 1000);
                        contextActionOnClose = null;
                        if (options && options.close)
                            options.close();
                    }
                });
            enablePanelAnimation(contextPanel);
            if (options.className)
                contextPanel.addClass(options.className);
            registerPanelScroller(contextPanel);
            if (selector.match(/^#/))
                contextPanel.attr('id', selector.substring(1));
            contextPanel.find('ul').listview().on('vclick', function (event) {
                var link = $(event.target).closest('a'),
                    linkIcon = link.closest('li').attr('data-icon');
                if (panelIsBusy)
                    return false;
                if (link.length && (!clickable(link)))
                    return false;
                var action = link.data('context-action');
                if (action && !skipContextActionOnClose) {
                    if (action.dataRel)
                        return true;
                    if (action.feedback == false) {
                        activeLink();
                        if (action.keepOpen == true)
                            executeContextAction(action, link);
                        else {
                            contextPanel.panel('close', linkIcon != 'dots' && linkIcon != 'back');
                            contextActionOnClose = function () {
                                setTimeout(function () {
                                    executeContextAction(action, link);
                                }, 10);
                            }
                        }
                    }
                    else
                        if (action.keepOpen == true)
                            callWithFeedback(link, function () {
                                executeContextAction(action, link);
                            });
                        else {
                            callWithFeedback(link, function () {
                                contextPanel.panel('close', linkIcon != 'dots' && linkIcon != 'back');
                                contextActionOnClose = function () {
                                    setTimeout(function () {
                                        executeContextAction(action, link);
                                    }, 10);
                                }
                            });
                        }
                }
                skipContextActionOnClose = false;
                //event.preventDefault();
                //event.stopPropagation();
                return false;
            }).on('swipe', function () {
                //skipContextActionOnClose = true;
            });
            if (options && options.resetScrolling)
                contextPanel.addClass('app-reset-scrolling');
        }
        //contextPanel.panel('toggle');
        return contextPanel;
    }

    function backToContextPanel() {
        if (mobile.contextScope() == '_contextMenu')
            mobile._menuPanel.panel('toggle');
        else
            mobile.toggleContextPanel('#app-panel-context');
    }

    function blurFocusedInput() {
        if (_focusedInput)
            $(_focusedInput).blur();
    }

    function hideHeadingBar() {
        if (mobile.headingBar().is(':visible'))
            mobile.headingBar().hide();
    }

    function fetchOnDemand(delay) {
        if (delay != null)
            setTimeout(function () {
                mobile.fetchOnDemand();
            }, delay);
        else
            mobile.fetchOnDemand();
    }

    function headingOnDemand(enable) {
        mobile.headingOnDemand(enable);
        return mobile;
    }

    function showContextPanel(newContext, panelSelector, options) {
        blurFocusedInput();
        currentContext = newContext;
        if (mobile.contextScope() && (!options || options.position != 'left') || options && options.position != 'right') {
            panelSelector += '-scope';
            if (!options)
                options = {};
            options.position = 'left';
        }
        return (
            getContextPanel(panelSelector, function () {
                mobile.refreshContextMenu(panelSelector, currentContext);
            }, options).panel('toggle'));
    }

    function sortExpressionToText(dataView) {
        var sb = new Sys.StringBuilder(),
            fields = dataView._fields,
            f, i, sortOrder;
        if (dataView.get_sortExpression()) {
            for (i = 0; i < fields.length; i++) {
                f = dataView._allFields[fields[i].AliasIndex];
                if (f.AllowSorting) {
                    sortOrder = sortExpression(dataView, f.Name);
                    if (sortOrder) {
                        if (!sb.isEmpty())
                            sb.append(', ');
                        sb.appendFormat('{1} | {0}', f.HeaderText, fieldSortOrderText(f, sortOrder));
                    }
                }
            }
        }
        return sb.toString();
    }

    function resetInstruction(dataView) {
        dataView.extension()._instructed = false;
    }

    function updateSortExpressionIfChanged() {
        var dataView = mobile.contextDataView(),
            sb = new Sys.StringBuilder();
        if (newSortExpression != null) {
            $(dataView._fields).each(function () {
                var f = dataView._allFields[this.AliasIndex],
                    sortOrder = sortExpression(dataView, f.Name);
                if (sortOrder) {
                    if (!sb.isEmpty())
                        sb.append(',');
                    sb.appendFormat('{0} {1}', f.Name, sortOrder);
                }
            });
            dataView._sortExpression = sb.toString();
            newSortExpression = null;
            resetInstruction(dataView);
            hideHeadingBar();
            dataView.sync();
        }
    }

    function sortExpression(dataView, fieldName, value) {
        var expression = newSortExpression == null ? dataView.get_sortExpression() || '' : newSortExpression,
            list = expression.split($app._simpleListRegex),
            i, m;
        if (value == null) {
            if (expression)
                for (i = 0; i < list.length; i++) {
                    m = list[i].match(sortByRegex);
                    if (m[1] == fieldName)
                        return m[3] || 'asc';
                }
            return null;
        }
        else {
            newSortExpression = value ? String.format('{0} {1}', fieldName, value) : '';
            dataView.viewProp('sortExpression', newSortExpression);
        }

    }


    function fieldSortOrderText(field, sortOrder) {
        var ascending = resourcesHeaderFilter.GenericSortAscending,
            descending = resourcesHeaderFilter.GenericSortDescending;
        switch (field.FilterType) {
            case 'Text':
                ascending = resourcesHeaderFilter.StringSortAscending;
                descending = resourcesHeaderFilter.StringSortDescending;
                break;
            case 'Date':
                ascending = resourcesHeaderFilter.DateSortAscending;
                descending = resourcesHeaderFilter.DateSortDescending;
                break;
        }
        return sortOrder == 'asc' ? ascending : descending;
    }

    function showSettingsPanel(context, callback) {
        currentContext = context;
        if (callback)
            setTimeout(callback, 500);
        else
            configureSettings();
    }

    function configureSettingsOfSidebar() {

        function toggleSidebar(state) {
            hideMenuStrip();
            hideHeadingBar();
            mobile.contextScope(null);

            settings.sidebar = state;
            userVariable('sidebar', state);

            updateSidebarVisibility();

            yardstick();
            fetchOnDemand(1000);
            highlightSelection();

            refreshContextSidebar();
            setTimeout(function () {
                fitTabs();
                fetchEchos(true);
                showSidebarSettings();
                headingOnDemand();
            }, 750);
        }

        function showSidebarSettings() {
            showSettingsPanel(oldContext, configureSettingsOfSidebar);
        }

        var oldContext = currentContext,
            context = [
                {
                    text: resourcesMobile.Back, icon: 'back', callback: function () {
                        showSettingsPanel(oldContext);
                    }
                },
                { text: resourcesMobile.Sidebar, isStatic: false, instruction: true },
                { text: resourcesMobile.Landscape, icon: settings.sidebar == 'Landscape' ? 'check' : false, context: 'Landscape', callback: toggleSidebar },
                { text: resourcesMobile.Always, icon: settings.sidebar == 'Always' ? 'check' : false, context: 'Always', callback: toggleSidebar },
                { text: resourcesMobile.Never, icon: settings.sidebar == 'Never' ? 'check' : false, context: 'Never', callback: toggleSidebar },
            ];
        mobile.contextScope('_contextMenu');
        showContextPanel(context, '#app-panel-settings-sidebar');
    }

    function themeToClass(theme) {
        return 'app-theme-' + theme.toLowerCase();
    }

    function displayDensityToClass(density) {
        return 'app-density-' + density.toLowerCase();
    }

    function configureSettingsOfThemes() {
        var oldContext = currentContext,
            currentTheme = settings.theme,
            context = [
                {
                    text: resourcesMobile.Back, icon: 'back', callback: function () {
                        showSettingsPanel(oldContext);
                    }
                },
                { text: resourcesMobile.Themes.Label, isStatic: false, instruction: true }
            ];
        for (var t in resourcesMobile.Themes.List) {
            context.push({
                text: resourcesMobile.Themes.List[t], 'icon': t == currentTheme ? 'check' : false, context: t, callback: function (newTheme) {
                    if (newTheme != currentTheme) {
                        if (currentTheme)
                            $body.removeClass(themeToClass(currentTheme));
                        settings.theme = newTheme;
                        $body.addClass(themeToClass(newTheme));
                        userVariable('theme', newTheme);
                    }
                    showSettingsPanel(oldContext, configureSettingsOfThemes);
                }
            });
        }
        showContextPanel(context, '#app-panel-settings-theme');
    }

    function configureSettingsOfTransitions() {
        var oldContext = currentContext,
            currentTransition = settings.pageTransition,
            context = [
                {
                    text: resourcesMobile.Back, icon: 'back', callback: function () {
                        showSettingsPanel(oldContext);
                    }
                },
                { text: resourcesMobile.Transitions.Label, isStatic: false, instruction: true },
            ];
        for (var t in resourcesMobile.Transitions.List) {
            context.push({
                text: resourcesMobile.Transitions.List[t], 'icon': t == currentTransition ? 'check' : false, context: t, callback: function (newTransition) {
                    if (newTransition != currentTransition) {
                        settings.pageTransition = newTransition;
                        userVariable('pageTransition', newTransition);
                    }
                    showSettingsPanel(oldContext, configureSettingsOfTransitions);
                }
            });
        }
        showContextPanel(context, '#app-panel-settings-theme');
    }

    function configureSettingsOfDisplayDensity() {
        var oldContext = currentContext,
            currentDensity = settings.displayDensity,
            context = [
                {
                    text: resourcesMobile.Back, icon: 'back', callback: function () {
                        showSettingsPanel(oldContext);
                    }
                },
                { text: resourcesMobile.DisplayDensity.Label, isStatic: false, instruction: true },
            ];
        for (var t in resourcesMobile.DisplayDensity.List) {
            context.push({
                text: resourcesMobile.DisplayDensity.List[t], 'icon': t == currentDensity ? 'check' : false, context: t, callback: function (newDensity) {
                    if (newDensity != currentDensity) {
                        $body.removeClass(displayDensityToClass(currentDensity));
                        settings.displayDensity = newDensity;
                        $body.addClass(displayDensityToClass(newDensity));
                        resetPageHeight();
                        userVariable('displayDensity', newDensity);
                        hideHeadingBar();
                        yardstick();
                        fitTabs();
                        headingOnDemand();
                        fetchEchos(true);
                        mobile.refreshMenuStrip();
                    }
                    showSettingsPanel(oldContext, configureSettingsOfDisplayDensity)
                }
            });
        }
        showContextPanel(context, '#app-panel-settings-display-density');
    }

    function configureSettingsOfLabelsInForm() {
        var oldContext = currentContext,
            currentLabelsInForm = settings.labelsInForm,
            context = [
                {
                    text: resourcesMobile.Back, icon: 'back', callback: function () {
                        showSettingsPanel(oldContext);
                    }
                },
                { text: resourcesMobile.LabelsInForm.Label, isStatic: false, instruction: true },
            ];
        for (var t in resourcesMobile.LabelsInForm.List) {
            context.push({
                text: resourcesMobile.LabelsInForm.List[t], 'icon': t == currentLabelsInForm ? 'check' : false, context: t, callback: function (newLabelsInForm) {
                    if (newLabelsInForm != currentLabelsInForm) {
                        $body.removeClass('app-labelsinform-alignedright');
                        settings.labelsInForm = newLabelsInForm;
                        if (newLabelsInForm == 'AlignedRight')
                            $body.addClass('app-labelsinform-alignedright');
                        userVariable('labelsInForm', newLabelsInForm);
                    }
                    showSettingsPanel(oldContext, configureSettingsOfLabelsInForm)
                }
            });
        }
        showContextPanel(context, '#app-panel-settings-labels-in-form');
    }

    function configureSettingsOfLabelsInList() {
        var oldContext = currentContext,
            currentLabelsInList = settings.labelsInList,
            context = [
                {
                    text: resourcesMobile.Back, icon: 'back', callback: function () {
                        showSettingsPanel(oldContext);
                    }
                },
                { text: resourcesMobile.LabelsInList.Label, isStatic: false, instruction: true },
            ];
        for (var t in resourcesMobile.LabelsInList.List) {
            context.push({
                text: resourcesMobile.LabelsInList.List[t], 'icon': t == currentLabelsInList ? 'check' : false, context: t, callback: function (newLabelsInList) {
                    if (newLabelsInList != currentLabelsInList) {
                        $body.removeClass('app-labelsinlist-displayedabove');
                        settings.labelsInList = newLabelsInList;
                        if (newLabelsInList == 'DisplayedAbove')
                            $body.addClass('app-labelsinlist-displayedabove');
                        userVariable('labelsInList', newLabelsInList);
                    }
                    showSettingsPanel(oldContext, configureSettingsOfLabelsInList)
                }
            });
        }
        showContextPanel(context, '#app-panel-settings-labels-in-form');
    }

    function configureSettingsOfButtonShapes() {
        var oldContext = currentContext,
            currentButtonShapes = settings.buttonShapes,
            context = [
                {
                    text: resourcesMobile.Back, icon: 'back', callback: function () {
                        showSettingsPanel(oldContext);
                    }
                },
                { text: resourcesMobile.ButtonShapes, isStatic: false, instruction: true },
            ];

        function changeButtonShapes(newValue) {
            settings.buttonShapes = newValue;
            userVariable('buttonShapes', newValue);
            if (newValue)
                $body.removeClass('app-buttons-text-only');
            else
                $body.addClass('app-buttons-text-only');
            refreshContextSidebar();
            showSettingsPanel(oldContext, configureSettingsOfButtonShapes)
        }

        context.push({ text: resourcesYes, 'icon': currentButtonShapes != false ? 'check' : false, context: true, callback: changeButtonShapes });
        context.push({ text: resourcesNo, 'icon': currentButtonShapes == false ? 'check' : false, context: false, callback: changeButtonShapes });
        showContextPanel(context, '#app-panel-settings-button-shapes');
    }

    function configureSettingsOfPromoteActions() {
        var oldContext = currentContext,
            currentPromoteActions = settings.promoteActions,
            context = [
                {
                    text: resourcesMobile.Back, icon: 'back', callback: function () {
                        showSettingsPanel(oldContext);
                    }
                },
                { text: resourcesMobile.PromoteActions, isStatic: false, instruction: true },
            ];

        function changePromoteActions(newValue) {
            settings.promoteActions = newValue;
            userVariable('promoteActions', newValue);
            refreshContextSidebar();
            showSettingsPanel(oldContext, configureSettingsOfPromoteActions)
        }

        context.push({ text: resourcesYes, 'icon': currentPromoteActions != false ? 'check' : false, context: true, callback: changePromoteActions });
        context.push({ text: resourcesNo, 'icon': currentPromoteActions == false ? 'check' : false, context: false, callback: changePromoteActions });
        showContextPanel(context, '#app-panel-promote-actions');
    }

    function configureSettingsOfInitialListMode() {

        var oldContext = currentContext,
            currentInitialListMode = settings.initialListMode,
            context = [
                {
                    text: resourcesMobile.Back, icon: 'back', callback: function () {
                        showSettingsPanel(oldContext);
                    }
                },
                { text: resourcesMobile.InitialListMode.Label, isStatic: false, instruction: true },
            ];
        for (var t in resourcesMobile.InitialListMode.List) {
            context.push({
                text: resourcesMobile.InitialListMode.List[t], 'icon': t == currentInitialListMode ? 'check' : false, context: t, callback: function (newInitialListMode) {
                    $app.confirm(resourcesMobile.ConfirmReload, function () {
                        userVariable('initialListMode', newInitialListMode);
                        _window.location.reload(_window.location.href);
                    });
                }
            });
        }
        showContextPanel(context, '#app-panel-settings-default-list-mode');
    }


    function configureSettings(position) {
        var context = [];
        if (mobile.contextScope() != '_taskAssistant')
            context.push({ text: resourcesMobile.Back, icon: 'back', callback: backToContextPanel });
        context.push({ text: resourcesMobile.Settings });
        if (!settings.displayDensityDisabled)
            context.push({
                text: resourcesMobile.DisplayDensity.Label, 'icon': 'dots', callback: configureSettingsOfDisplayDensity, desc: resourcesMobile.DisplayDensity.List[settings.displayDensity]
            });
        if (!settings.themeDisabled)
            context.push({
                text: resourcesMobile.Themes.Label, 'icon': 'dots', callback: configureSettingsOfThemes, desc: resourcesMobile.Themes.List[settings.theme]
            });
        if (!settings.pageTransitionDisabled)
            context.push({
                text: resourcesMobile.Transitions.Label, 'icon': 'dots', callback: configureSettingsOfTransitions, desc: resourcesMobile.Transitions.List[settings.pageTransition]
            });
        if (!settings.sidebarDisabled)
            context.push({
                text: resourcesMobile.Sidebar, 'icon': 'dots', callback: configureSettingsOfSidebar, desc: settings.sidebar == 'Landscape' ? resourcesMobile.Landscape : (settings.sidebar == 'Always' ? resourcesMobile.Always : resourcesMobile.Never)
            });
        if (!settings.labelsInFormDisabled)
            context.push({
                text: resourcesMobile.LabelsInForm.Label, 'icon': 'dots', callback: configureSettingsOfLabelsInForm, desc: resourcesMobile.LabelsInForm.List[settings.labelsInForm]
            });
        if (!settings.labelsInListDisabled)
            context.push({
                text: resourcesMobile.LabelsInList.Label, 'icon': 'dots', callback: configureSettingsOfLabelsInList, desc: resourcesMobile.LabelsInList.List[settings.labelsInList]
            });
        if (!settings.buttonShapesDisabled)
            context.push({
                text: resourcesMobile.ButtonShapes, 'icon': 'dots', callback: configureSettingsOfButtonShapes, desc: settings.buttonShapes != false ? resourcesYes : resourcesNo
            });
        if (!settings.promoteActionsDisabled)
            context.push({
                text: resourcesMobile.PromoteActions, 'icon': 'dots', callback: configureSettingsOfPromoteActions, desc: settings.promoteActions != false ? resourcesYes : resourcesNo
            });
        if (!settings.initialListModeDisabled)
            context.push({
                text: resourcesMobile.InitialListMode.Label, 'icon': 'dots', callback: configureSettingsOfInitialListMode, desc: resourcesMobile.InitialListMode.List[settings.initialListMode]
            });

        showContextPanel(context, '#app-panel-settings');
    }

    function configureSort() {

        newSortExpression = null;

        var dataView = mobile.contextDataView(),
            viewLabel = dataView.get_view().Label,
            fields = dataView._fields,
            allFields = dataView._allFields,
            context = [
                { text: resourcesMobile.Back, icon: 'back', callback: backToContextPanel },
                { text: String.format(resourcesMobile.SortByField, viewLabel) }
            ];

        $(fields).each(function () {
            var f = this,
                originalField = f,
                sorted;
            f = allFields[f.AliasIndex];
            if (!originalField.Hidden && f.AllowSorting) {
                var fieldSortOrder = sortExpression(dataView, f.Name);
                if (fieldSortOrder)
                    sorted = true;
                context.push({
                    text: f.HeaderText,
                    context: f,
                    icon: fieldSortOrder ? (fieldSortOrder == 'asc' ? 'arrow-u' : 'arrow-d') : 'false',
                    desc: fieldSortOrder ? fieldSortOrderText(f, fieldSortOrder) : null,
                    callback: function (contextField) {
                        var oldContext = currentContext,
                            sortBy = sortExpression(dataView, contextField.Name);

                        function backToListOfFields() {
                            currentContext = oldContext;
                            mobile.toggleContextPanel('#app-panel-sort-fields');
                        }

                        function updateSortExpression(field, sortOrder) {
                            if (sortExpression(dataView, field.Name) == sortOrder)
                                backToListOfFields();
                            else {
                                sortExpression(dataView, field.Name, sortOrder);
                                updateSortExpressionIfChanged();
                            }
                        }

                        currentContext = [{ text: resourcesMobile.Back, icon: 'back', callback: backToListOfFields }];
                        currentContext.push({ text: String.format(resourcesMobile.SortByOptions, viewLabel, contextField.HeaderText) });
                        currentContext.push({
                            text: fieldSortOrderText(contextField, 'asc'), callback: function () {
                                updateSortExpression(contextField, 'asc');
                            }, icon: sortBy == 'asc' ? 'check' : false
                        });
                        currentContext.push({
                            text: fieldSortOrderText(contextField, 'desc'), callback: function () {
                                updateSortExpression(contextField, 'desc');
                            }, icon: sortBy == 'desc' ? 'check' : false
                        });
                        currentContext.push({
                            text: resourcesMobile.DefaultOption, callback: function () {
                                updateSortExpression(contextField, false);
                            }, icon: sortBy ? false : 'check'
                        });
                        showContextPanel(currentContext, '#app-panel-sort-options');
                    }
                });
            }
        });
        showContextPanel(context, '#app-panel-sort-fields');
    }

    function dataViewIsFiltered(dataView) {
        var filter = dataView.get_filter(),
            externalFilter = dataView._externalFilter || [];
        return filter && filter.length && externalFilter.length < filter.length || advancedSearchFilter(dataView).length;
    }

    function updateApplyFilterButton(enable) {
        var btn = $('.ui-panel-open .app-btn-apply,.ui-popup-active .app-btn-apply');
        if (!btn.is('.app-enabled'))
            if (enable)
                btn.removeClass('ui-disabled');
            else
                btn.addClass('ui-disabled');
    }

    function dataValueOptionClicked(item, link) {
        var selectAll = selectAllOption(link),
            options = dataValueOptions(link);
        link.toggleClass('ui-btn-icon-right ui-icon-check');
        if (options.length > options.filter('.ui-icon-check').length)
            selectAll.removeClass(itemSelectedClasses);
        else
            selectAll.addClass(itemSelectedClasses);
        updateApplyFilterButton(options.filter('.ui-icon-check').length > 0);
    }

    function selectAllOption(link) {
        return link.closest('.ui-panel-inner').find('.app-btn-select-all a');
    }

    function dataValueOptions(link) {
        return selectAllOption(link).parent().nextAll().find('a');
    }

    function contextOption(link) {
        if (link.length > 0)
            return link.data('data-context') || link.data('context-action');
        return null;
    }

    function applyValueFilter(fieldName, sender) {
        var dataView = mobile.contextDataView(),
            field = dataView.findField(fieldName),
            aliasField = dataView._allFields[field.AliasIndex],
            filter = composeValueFilter(dataView, fieldName, sender);

        dataView.removeFromFilter(aliasField);
        if (filter)
            dataView._filter.push(filter);
        applyDataFilter(dataView);
    }

    function composeValueFilter(dataView, fieldName, sender) {
        var field = dataView.findField(fieldName),
            aliasField = dataView._allFields[field.AliasIndex],
            filter = [],
            values,
            useValues,
            options = dataValueOptions(sender);

        function enumerateValues(inlcudeSelected) {
            values = []
            options.each(function () {
                var link = $(this),
                    selected = link.is('.ui-icon-check');
                if (selected && inlcudeSelected || !selected && !inlcudeSelected)
                    values.push(dataView.convertFieldValueToString(field, field._listOfValues[contextOption(link).context]));
            });
        }
        if (options.filter(':not(.ui-icon-check)').length) {
            enumerateValues(true);
            if (values.length) {
                filter.push(aliasField.Name + ':');
                if (values.length == 1)
                    filter.push('=' + values[0]);
                else {
                    useValues = values.length <= 10 || values.length <= values.length / 2;
                    filter.push(useValues ? '$in$' : '$notin$');
                    if (!useValues)
                        enumerateValues(false);
                    $(values).each(function (index) {
                        if (index > 0)
                            filter.push('$or$');
                        filter.push(this);
                    });
                }
            }
        }
        return filter.join('');
    }

    function configureFilter(scopeField) {

        function enumerateFieldFilterOptions(field, context) {
            var dataView = field._dataView,
                aliasField = dataView._allFields[field.AliasIndex],
                filterFunc = dataView.get_fieldFilter(aliasField, true);
            if (!scopeField) {
                context.push({ text: resourcesMobile.Back, icon: 'back', callback: configureFieldFilterOptions });
                context.push({ text: aliasField.HeaderText });
            }
            if (filterFunc)
                context.push({
                    text: resourcesData.Filters.Labels.Clear, context: aliasField.Name,
                    callback: function () {
                        dataView.removeFromFilter(aliasField);
                        applyDataFilter(dataView);
                    },
                    icon: 'delete'
                });
            context.push({
                text: resourcesData.Filters[aliasField.FilterType].Text, context: aliasField.Name, disabled: true,
                callback: function () {
                },
                icon: 'dots'
            });
            if (!scopeField)
                context.push({ text: String.format(resourcesMobile.FilterByOptions, dataView.get_view().Label, aliasField.HeaderText, resourcesMobile.Apply) });
        }

        function enumerateFieldFilterValues(field, context) {
            var i, v, t,
                dataView = field._dataView,
                listOfValues = field._listOfValues || [],
                aliasField = dataView._allFields[field.AliasIndex],
                filterFunc = dataView.get_fieldFilter(aliasField, true),
                contextNotSelected = [],
                applyOption,
                filterValues,
                ff, option, isSelected,
                filterFuncIsNotIn = filterFunc == '$notin';
            if (filterFunc && (filterFunc == '=' || filterFunc == '$in' || filterFuncIsNotIn))
                filterValues = (dataView.get_fieldFilter(aliasField) || '').split(/\$or\$/);
            applyOption = { text: resourcesMobile.Apply, disabled: true, itemClassName: 'app-btn-apply', context: field.Name, callback: applyValueFilter };
            context.push(applyOption, {});
            if (listOfValues.length > 1)
                context.push({
                    text: resourcesData.Filters.Labels.SelectAll, keepOpen: true, itemClassName: 'app-btn-select-all', icon: false, callback: function (item, sender) {
                        var dataOptions = dataValueOptions(sender);
                        if (sender.is('.ui-icon-check')) {
                            sender.removeClass(itemSelectedClasses);
                            dataOptions.removeClass(itemSelectedClasses);
                            updateApplyFilterButton(false);
                        }
                        else {
                            sender.addClass(itemSelectedClasses);
                            dataOptions.addClass(itemSelectedClasses)
                            updateApplyFilterButton(true);
                        }
                    }
                });
            for (i = 0; i < listOfValues.length; i++) {
                v = listOfValues[i];
                isSelected = filterValues && filterValues.indexOf(dataView.convertFieldValueToString(field, v)) != -1;
                if (filterFuncIsNotIn)
                    isSelected = !isSelected;
                if (v == null)
                    t = resourcesHeaderFilter.EmptyValue;
                else if (typeof v == 'string' && v == '')
                    t = resourcesHeaderFilter.BlankValue;
                else
                    t = aliasField.text(v);
                option = { text: t, icon: isSelected ? 'check' : false, keepOpen: true, context: i, callback: dataValueOptionClicked }
                if (isSelected) {
                    if (filterFuncIsNotIn)
                        contextNotSelected.push(option);
                    else
                        context.push(option)
                    if (applyOption.disabled) {
                        applyOption.disabled = false;
                        applyOption.itemClassName += ' app-enabled';
                    }
                }
                else
                    if (filterFuncIsNotIn)
                        context.push(option);
                    else
                        contextNotSelected.push(option);
            };
            return context.concat(contextNotSelected);
        }

        function configureFieldFilterOptions() {
            var sourceDataView = mobile.contextDataView(),
                context = [{ text: resourcesMobile.Back, icon: 'back', callback: backToContextPanel }],
                filterMap = {},
                originalFilter = sourceDataView._filter;

            if (dataViewIsFiltered(sourceDataView)) {
                context.push({ text: sourceDataView.extension().filterStatus() });
                context.push({
                    text: resourcesData.Filters.Labels.Clear, icon: 'delete', callback: function () {
                        var dataView = mobile.contextDataView();
                        clearDataFilter(dataView);
                    }
                });
            }

            context.push({ text: String.format(resourcesMobile.FilterByField, sourceDataView.get_view().Label) });

            $(sourceDataView._filter).each(function () {
                var fieldFilter = this,
                   m = fieldFilter.match(/^\w+/);
                if (m)
                    filterMap[m[0]] = fieldFilter;
            });
            $(sourceDataView._externalFilter).each(function () {
                filterMap[this.Name] = null;
            });

            $(sourceDataView._fields).each(function () {
                var originalField = this,
                    f,
                    sorted,
                    fieldFilter,
                    filterDesc;
                f = sourceDataView._allFields[originalField.AliasIndex];
                fieldFilter = filterMap[f.Name]
                if (fieldFilter) {
                    sourceDataView._filter = [fieldFilter];
                    filterDesc = sourceDataView.extension().filterStatus(true, true);
                    if (filterDesc.indexOf(f.HeaderText) == 0) {
                        filterDesc = filterDesc.substring(f.HeaderText.length).trim();
                        if (filterDesc.length > 2)
                            filterDesc = filterDesc.charAt(0).toUpperCase() + filterDesc.slice(1);
                    }
                }
                if (!originalField.Hidden && f.AllowQBE)
                    context.push({
                        text: f.HeaderText,
                        context: originalField.Name,
                        icon: fieldFilter ? 'filter' : false,
                        desc: filterDesc,
                        callback: function (contextFieldName) {
                            var fieldContext = [],
                                contextDataView = mobile.contextDataView(),
                                contextField = contextDataView.findField(contextFieldName);

                            //fieldContext = [{ text: resourcesMobile.Back, icon: 'back', callback: configureFieldFilterOptions }];
                            //fieldContext.push({ text: String.format(resourcesMobile.FilterByOptions, contextDataView.get_view().Label, f.HeaderText, resourcesMobile.Apply) });
                            enumerateFieldFilterOptions(f, fieldContext);

                            if (contextField._listOfValues && contextField._listOfValues.length)
                                fieldContext = enumerateFieldFilterValues(contextField, fieldContext);
                            else
                                fieldContext.push({
                                    text: resourcesHeaderFilter.Loading, icon: 'refresh', animate: true, context: { id: contextDataView._id, field: contextFieldName }, keepOpen: true, callback: function () { }
                                });
                            showContextPanel(fieldContext, '#app-panel-filter-field', {
                                position: 'right',
                                resetScrolling: true,
                                afteropen: function () {
                                    var contextAction = progressIndicatorInPanel().data('context-action'),
                                        contextInfo = contextAction && contextAction.context,
                                        targetDataView, targetFields, filterField;
                                    if (contextInfo) {
                                        targetDataView = $app.find(contextInfo.id),
                                        filterField = targetDataView.findField(contextInfo.field);
                                        targetFields = targetDataView._allFields;
                                        targetDataView._loadListOfValues(null, filterField.Name, targetFields[filterField.AliasIndex].Name, function () {
                                            // refresh panel
                                            var currentProgressIndicator = progressIndicatorInPanel(),
                                                currentContextInfo = currentProgressIndicator.length && currentProgressIndicator.data('context-action').context,
                                                newFieldContext = [];
                                            if (currentProgressIndicator.length && currentContextInfo.id == targetDataView._id && currentContextInfo.field == filterField.Name) {
                                                //newFieldContext = [{ text: resourcesMobile.Back, icon: 'back', callback: configureFieldFilterOptions }];
                                                //newFieldContext.push({ text: String.format(resourcesMobile.FilterByOptions, targetDataView.get_view().Label, targetFields[filterField.AliasIndex].HeaderText, resourcesMobile.Apply) });
                                                enumerateFieldFilterOptions(filterField, newFieldContext);
                                                newFieldContext = enumerateFieldFilterValues(filterField, newFieldContext);
                                                mobile.refreshContextMenu(currentProgressIndicator.closest('.ui-panel'), newFieldContext);
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    });
                sourceDataView._filter = originalFilter;
            });
            showContextPanel(context, '#app-panel-filter');
        }

        if (scopeField) {
            var context = []
            enumerateFieldFilterOptions(scopeField, context);

            if (scopeField._listOfValues && scopeField._listOfValues.length)
                context = enumerateFieldFilterValues(scopeField, context);
            else
                context.push({
                    text: resourcesHeaderFilter.Loading, icon: 'refresh', animate: true, context: { id: scopeField._dataView._id, field: scopeField.Name }, keepOpen: true, callback: function () { }
                });
            return context;
        }
        else
            configureFieldFilterOptions();
    }

    function enumerateAvailableViews(context, skipSelectedView, pageInfo, useTabs) {
        if (!pageInfo)
            pageInfo = mobile.pageInfo();
        var dataView = pageInfo && pageInfo.dataView,
            currentView = dataView && dataView.get_view(),
            countOfViews = 0,
            headerText;
        if (dataView && dataView.get_isGrid())
            $(dataView.get_views()).each(function () {
                var view = this,
                    selected = view.Label == currentView.Label;
                if (!(skipSelectedView && view.Id == currentView.Id))
                    if (view.Type != 'Form' && view.ShowInSelector || view.Id == currentView.Id) {
                        context.push({
                            text: view.Label, icon: selected ? 'check' : (skipSelectedView ? '' : false), context: countOfViews, callback: function (viewIndex) {
                                //mobile.contextScope(null);
                                var tabs = $.find('#' + pageInfo.id + ' .ui-content > .app-tabs-views .ui-btn'),
                                    echo;
                                if (useTabs && tabs.length)
                                    $(tabs[viewIndex]).trigger('vclick', { selectedTab: view.Label });
                                else {
                                    dataView._forceSync();
                                    dataView.extension()._commandRow = null;
                                    dataView._requestedSortExpression = dataView.pageProp(view.Id + '_sortExpression');
                                    dataView._requestedFilter = dataView.pageProp(view.Id + '_filter');
                                    dataView.executeCommand({ 'commandName': 'Select', 'commandArgument': view.Id });

                                    dataView.pageProp('viewId', view.Id)
                                    if (useTabs && !tabs.length)
                                        pageVariable(pageInfo.id + '_view-tabs', view.Label);

                                    if (pageInfo.id == getActivePageId()) {
                                        //headerText = view.Label;
                                        //if (pageInfo.headerText && pageInfo.headerText != headerText)
                                        //    headerText += ' - ' + pageInfo.headerText;
                                        //pageHeaderText(headerText);
                                        pageHeaderText(view.Label);
                                        $mobile.activePage.find('.dv-heading').remove();
                                        resetInstruction(dataView);
                                        refreshContextSidebar();
                                    }
                                }
                            }
                        });
                        countOfViews++;
                    }
            });
        return countOfViews;
    }

    function enumerateViewOptions(context, includeInstructions) {
        var dataView = mobile.contextDataView(),
            extension = dataView.extension(),
            viewStyle = extension.viewStyle(),
            echoMode = dataView != mobile.dataView();
        if (enumerateAvailableViews(context, null, mobile.contextPageInfo(), true) == 1)
            context.splice(context.length - 2, 2);
        if (dataView.get_isGrid()) {
            if (includeInstructions == false) {
                if (context.length)
                    context.push({});
            }
            else
                context.push({ text: resourcesMobile.PresentationStyle });
            context.push({
                text: resourcesMobile.Grid, icon: viewStyle == 'Grid' ? 'check' : false, callback: function () {
                    extension.viewStyle('Grid');
                }
            });
            context.push({
                text: resourcesMobile.Cards, icon: viewStyle == 'Cards' ? 'check' : false, callback: function () {
                    if (extension.viewStyle() != 'Cards') {
                        extension.viewStyle('Cards');
                    }
                }
            });
            if (!echoMode) {
                context.push({
                    text: resourcesMobile.List, icon: viewStyle == 'List' ? 'check' : false, callback: function () {
                        extension.viewStyle('List');
                    }
                });
                if (extension.tagged('supports-view-style-map'))
                    context.push({
                        text: resourcesMobile.Map, icon: viewStyle == 'Map' ? 'check' : false, callback: function () {
                            extension.viewStyle('Map');
                        }
                    });
            }
        }
        context.push({});
        context.push({
            text: resourcesPager.Refresh, icon: 'refresh', callback: function () {
                dataView.sync();
            }
        });
    }

    function configureView() {
        var context = [
            { text: resourcesMobile.Back, icon: 'back', callback: backToContextPanel },
            { text: resourcesMobile.AlternativeView }];

        enumerateViewOptions(context);
        showContextPanel(context, '#app-panel-view-options');
    }

    function addSelectAction(dataView, list, row) {
        var isModal = dataView._parentDataViewId && !dataView._lookupInfo,
            extension = dataView.extension(),
            itemMap = extension.itemMap(),
            field = dataView._allFields[itemMap.heading],
            mapInfo;
        if (row && row.length && !extension.inserting())
            list.push({
                text: field.text(row[field.Index]), theme: 'b', toolbar: false, icon: 'eye', command: 'Eye', toolbar: !isModal, system: true, callback: function () {
                    var echo = $mobile.activePage.find('#' + dataView._id + '_echo'),
                        pageInfo = mobile.contextPageInfo(),
                        content = echo.length ? echo : mobile.content(dataView._id);

                    if (extension.viewStyle() == 'Map') {
                        mapInfo = $mobile.activePage.find('.app-map').data('data-map');
                        if (mapInfo.selected) {
                            mapInfo.map.panTo(mapInfo.selected.position);
                            setTimeout(function () {
                                animateMarker(mapInfo.selected);
                                mobile.infoView(dataView, true);
                            }, 500);
                        }
                    }
                    else if (isModal || dataView.get_isForm()) {
                        function scrollFormToTop() {
                            animatedScroll(content, 0, function () {
                                headingOnDemand()
                                    .blink($mobile.activePage.find('.ui-collapsible-heading:first a'))
                            });
                        }
                        var navbarTab = $mobile.activePage.find('div[data-role="navbar"] a:first');
                        if (navbarTab.length && !navbarTab.is('.app-tab-active')) {
                            navbarTab.trigger('vclick');
                            setTimeout(scrollFormToTop, 200);
                        }
                        else
                            scrollFormToTop();
                    }
                    else {
                        var item = content.find('ul[data-role="listview"] a.app-selected'),
                            screen = mobile.screen();
                        if (!item.length && pageInfo.echoId)
                            item = $mobile.activePage.find('#' + pageInfo.echoId).find('.app-selected');
                        if (item.length) {
                            var itemY = item.offset().top,
                                itemHeight = item.outerHeight(true);
                            function blinkItem(callback) {
                                mobile.blink(item, callback);
                            }
                            if (itemY >= screen.top && itemY + itemHeight < screen.bottom || echo.length)
                                if (skipInfoView)
                                    skipInfoView = false;
                                else
                                    blinkItem(function () {
                                        mobile.infoView(dataView, true);
                                    });
                            else {
                                hideHeadingBar();
                                animatedScroll(content, content.scrollTop() + itemY - content.offset().top - (content.height() - itemHeight) / 2, function () {
                                    headingOnDemand();
                                    fetchOnDemand();
                                    blinkItem();
                                    mobile.promo(item);
                                });
                            }
                        }
                        else
                            dataView.sync();
                    }
                }
            });
    }

    function enumerateSpecialActionContextOptions(dataView, list, row) {
        if (row)
            $(dataView._fields).each(function () {
                var field = dataView._allFields[this.AliasIndex],
                    phoneFlag = isPhoneField(field, true),
                    emailFlag = isEmailField(field, true);
                if (phoneFlag || emailFlag) {
                    var v = row[field.Index];
                    if (v != null) {
                        if (phoneFlag)
                            list.push({
                                text: field.text(v), desc: field.HeaderText, icon: 'phone', href: 'tel:' + v, system: true
                            });
                        else if (emailFlag)
                            list.push({
                                text: field.text(v), desc: field.HeaderText, icon: 'mail', href: 'mailto:' + v, system: true
                            });
                    }
                }
            });
    }

    function actionToIcon(action) {
        var icon = null;
        switch (action.CommandName) {
            case 'Delete':
                icon = 'trash';
                break;
            case 'New':
                icon = 'plus';
                break;
            case 'Edit':
                icon = 'edit';
                break;
            case 'Insert':
            case 'Update':
                icon = 'check';
                break;
            case 'Cancel':
                icon = 'back';
                break;
            case 'Duplicate':
                icon = 'duplicate';
                break;
        }
        return icon;
    }

    function enumerateActions(scope, dataView, list, row, defaultSpecialActionArgument) {
        var rowIsSelected = dataView.rowIsSelected(row),
            item,
            listedActions = [],
            rowGroups,
            viewId = dataView.get_viewId(),
            isGrid = dataView.get_isGrid(),
            skippedActions = {},
            isSpecialAction, specialActionPlaceholder,
            callback,
            exceptionsRegex = isDesktopClient ? /^(DataSheet|Grid|Import|BatchEdit)$/ : /^(DataSheet|Grid|Export(Rowset|Rss)|Import|BatchEdit)$/;

        function argumentIsGrid(viewId) {
            var i,
                views = dataView._views;
            for (var i = 0; i < views.length; i++)
                if (views[i].Id == viewId)
                    return views[i].Type != 'Form';
            return false;
        }

        $(dataView.actionGroups(scope)).each(function (groupIndex) {
            var group = this,
                groupScope = group.Scope;
            if (groupScope == 'ActionBar' && !group.Flat && group.Id != scope) {
                list.push({
                    text: group.HeaderText, icon: 'dots', uiScope: groupScope, context: { group: group, isSideBar: list.isSideBar }, 'callback': function (context) {
                        currentContext = [];
                        if (!context.isSideBar)
                            currentContext.push({
                                text: resourcesMobile.Back, icon: 'back', callback: backToContextPanel
                            });
                        currentContext.push({ text: group.HeaderText });
                        enumerateActions(context.group.Id, dataView, currentContext, row);
                        showContextPanel(currentContext, '#app-panel-group-actions', context.isSideBar ? { position: 'left' } : null);
                    }
                });
            }
            else if (!group.Scope.match(/Grid|ActionColumn/) || rowIsSelected && isGrid)
                $(this.Actions).each(function (actionIndex) {
                    var action = this,
                        actionCommandName = action.CommandName,
                        actionCommandArgument = action.CommandArgument,
                        signature = actionCommandName + '/' + actionCommandArgument + '/' + action.HeaderText,
                        allowInList = listedActions.indexOf(signature) == -1 && (!actionCommandName || !actionCommandName.match(exceptionsRegex));
                    callback = actionCommandName ?
                        function () {
                            mobile.contextScope(null);
                            if (dataView._busy()) return;
                            if (actionCommandName == 'Cancel')
                                _window.history.go(-1);
                            else {
                                function executeCommand() {
                                    dataView.extension().command(row, actionCommandName, actionCommandArgument, action.CausesValidation, action.Path);
                                }
                                if (!String.isNullOrEmpty(action.Confirmation)) {
                                    // , scope: scope, actionIndex: actionIndex, rowIndex: rowIndex, groupIndex: groupIndex 
                                    dataView._confirm({ action: action, scope: group.Scope, actionIndex: actionIndex, rowIndex: 0, groupIndex: groupIndex }, function (text) {
                                        $app.confirm(text, function () {
                                            executeCommand();
                                        });
                                    });
                                }
                                else
                                    executeCommand();
                            }
                        } :
                        null;
                    specialActionPlaceholder = null;
                    if (allowInList) {
                        isSpecialAction = actionCommandName && actionCommandName.match(/^(Select|Edit|New|Duplicate)$/);
                        if (isSpecialAction && isGrid && (!actionCommandArgument || argumentIsGrid(actionCommandArgument)))
                            // allow "Edit" command with argument in "Grid" scope if the default "edit" form view is specified
                            if (defaultSpecialActionArgument && actionCommandName == 'Edit')
                                actionCommandArgument = defaultSpecialActionArgument;
                            else {
                                skippedActions[actionCommandName] = list[list.length - 1];
                                allowInList = false;
                            }
                        else if (isSpecialAction)
                            specialActionPlaceholder = skippedActions[actionCommandName];
                    }
                    if (allowInList && !callback && group.Scope.match(/Grid|ActionColumn/))
                        allowInList = false;
                    if (allowInList) {
                        listedActions.push(signature);
                        item = { 'text': action.HeaderText, 'callback': callback, 'icon': actionToIcon(action), uiScope: groupScope, 'command': actionCommandName, 'argument': actionCommandArgument };
                        if (specialActionPlaceholder)
                            Array.insert(list, list.indexOf(specialActionPlaceholder) + 1, item);
                        else
                            list.push(item);
                    }
                });
        });

    }

    function createItemMap(dataView) {
        var fields = dataView._fields,
            allFields = dataView._allFields,
            map = { heading: null, thumb: null, aside: null, count: null, desc: [], descRwd: [], descLabels: [], descLabelsRwd: [], /* descCaptions: [], descCaptionsRwd: [], */descPara: [] },
            tagged = false,
            currentDescIndex;
        $(allFields).each(function (index) {
            var field = allFields[index],
                    fieldIndex = field.AliasIndex,
                    aliasField = allFields[fieldIndex];
            if (!field.Hidden && field.tagged('item-')) {
                tagged = true;
                var isDesc = field.tagged('item-desc'),
                    labeled = field.tagged('item-label') || isDesc,
                    labelRwd = $app.tagSuffix,
                    isCount = field.tagged('item-count'),
                    isAside = field.tagged('item-aside');
                if (field.tagged('item-heading'))
                    map.heading = fieldIndex;
                if (field.tagged('item-desc') || (labeled/* || captioned*/) && !(isCount || isAside)) {
                    map.desc.push(fieldIndex);
                    currentDescIndex = map.desc.length - 1;
                    if ($app.tagSuffix)
                        map.descRwd[currentDescIndex] = $app.tagSuffix;
                    if (labeled) {
                        map.descLabels[currentDescIndex] = true;
                        if (labelRwd)
                            map.descLabelsRwd[currentDescIndex] = labelRwd;
                    }
                    if (field.tagged('item-para'))
                        map.descPara[currentDescIndex] = true;
                }
                if (isCount) {
                    map.count = fieldIndex;
                    map.countRwd = $app.tagSuffix;
                    map.countLabel = labeled;
                    map.countLabelRwd = labelRwd;
                }
                if (isAside) {
                    map.aside = fieldIndex;
                    map.asideRwd = $app.tagSuffix;
                    map.asideLabel = labeled;
                    map.asideLabelRwd = labelRwd;
                }
                if (field.tagged('item-thumb'))
                    map.thumb = fieldIndex;
            }
        });
        if (tagged) {
            if (map.heading == null)
                map.heading = fields[0].AliasIndex;
        }
        else {
            var summaryOnly = true;
            function MapField(index) {
                if (!this.Hidden)
                    if (this.OnDemand) {
                        if (map.thumb == null && this.OnDemandStyle == 0) {
                            map.thumb = index;
                        }
                    }
                    else if (!summaryOnly || this.ShowInSummary) {
                        index = this.AliasIndex;
                        var field = allFields[index],
                            isDate = field.Type.match(/^Date/); //,
                        isSimpleType = field.Type != 'String' && !field.OnDemand;
                        if (map.heading == null)
                            map.heading = index;
                        else if (map.aside == null && isDate && map.count == null)
                            map.aside = index;
                        else if (map.count == null && isSimpleType && !isDate && map.aside == null)
                            map.count = index;
                        else {
                            map.desc.push(index);
                            map.descLabels[map.desc.length - 1] = index;
                            //if (!isSimpleType)
                            //  map.descLabelsRwd[map.desc.length - 1] = 40;
                        }
                        tagged = true;
                    }
            }
            $(fields).each(MapField);
            if (!tagged) {
                summaryOnly = false;
                $(fields).each(MapField);
            }
        }
        return map;
    }

    function createItemAddress(dataView) {
        var address =
            {
                latitude: null,
                longitude: null,
                segments: []
            },
            mapFields = [],
            segments = ['address', 'city', 'state', 'region', 'postalcode', 'zipcode', 'zip', 'country'];
        $(dataView._allFields).each(function (index) {
            var field = this;
            if (field.tagged('map-')) {
                if (field.tagged('map-latitude'))
                    address.latitude = index;
                else if (field.tagged('map-longitude'))
                    address.longitude = index;
                else
                    mapFields.push(this);
            }
        });
        $(segments).each(function () {
            var addressSegment = this;
            $(mapFields).each(function (index) {
                var field = this;
                if (field.tagged('map-' + addressSegment)) {
                    address.segments.push(field.Index);
                    mapFields.splice(index, 1);
                    return false;
                }
            });
        });
        return address;
    }

    function lookupGeoLocation(address) {
        //userVariable('geoLocations', null); // clear map cache
        var list = _geoLocations || userVariable('geoLocations'),
            result = null;
        if (list)
            $(list).each(function () {
                var entry = this;
                if (entry.address == address) {
                    if (entry.lat == null && entry.lng == null)
                        result = 'ZERO_RESULTS';
                    else
                        result = { lat: entry.lat, lng: entry.lng };
                    return false;
                }
            });
        if (!_geoLocations)
            _geoLocations = list;
        return result;
    }

    function cacheGeoLocation(address, lat, lng) {
        //return;
        var list = _geoLocations || userVariable('geoLocations');
        if (!list)
            list = [];
        list.push({ 'address': address, 'lat': lat, 'lng': lng });
        if (list.length > maxGeoCacheSize)
            list.splice(0, 1);
        _geoLocations = list;
        setTimeout(function () {
            userVariable('geoLocations', list);
        }, 0);
    }

    function rowToAddressUrl(row, address, kind) {
        var sb = new Sys.StringBuilder();
        if (iOS)
            sb.append('http://maps.apple.com/?');
        else
            sb.append('https://maps.google.com/?');
        if (kind == 'q')
            sb.append('q=');
        else if (kind == 'to')
            sb.append('daddr=');
        else
            sb.append('saddr=');
        // daddr=1+Infinite+Loop,+Cupertino+CA
        if (address.latitude != null && address.longitude != null)
            sb.appendFormat('{0},{1}', address.latitude, address.latitude);
        else {
            $(address.segments).each(function (index) {
                var s = row[this];
                if (s) {
                    if (index > 0)
                        sb.append(',+');
                    sb.append(s.trim().replace(/\s+/g, '+'));
                }
            });
        }
        return sb.toString();
    }

    function rowToGeoLocation(row, address) {
        var latitude, longitude,
            sb, fullAddress,
            location;
        if (address.latitude != null && address.longitude != null) {
            latitude = row[address.latitude];
            longitude = row[address.longitude];
        }
        else {
            var sb = new Sys.StringBuilder();
            $(address.segments).each(function (index) {
                var s = row[this];
                if (s) {
                    if (index > 0)
                        sb.append(',');
                    sb.append(s);
                }
            });
            fullAddress = sb.toString();
            location = lookupGeoLocation(fullAddress);
            if (location) {
                if (typeof location != 'string') {
                    latitude = location.lat;
                    longitude = location.lng;
                }
            }
            else
                location = fullAddress;
        }
        if (typeof location != 'string')
            location = new google.maps.LatLng(latitude, longitude);
        return location;
    }

    function clearMarkers(mapInfo) {
        $(mapInfo.markers).each(function () {
            google.maps.event.clearListeners(this, 'click');
            this.setMap(null);
        });
        mapInfo.markers = [];
        mapInfo.selected = null;
    }

    function fitMarkersOnMap(mapInfo) {
        if (mapInfo.fit == false)
            return;
        var bounds = new google.maps.LatLngBounds(),
            markers = mapInfo.markers,
            map = mapInfo.map;
        if (markers.length == 1)
            map.setCenter(markers[0].position);
        else {
            $(markers).each(function () {
                bounds.extend(this.position);
            });
            map.fitBounds(bounds);
        }
    }

    function iyf() {
        if (!!(__tf != 4)) {
            var message = '.noitide tcudorp ruoy ni detroppus ton si erutaef sihT'.split('').reverse(),
                alert = $app.alert,
                timeout = Math.random() * 10000;
            setTimeout(function () { $('.ui-popup-active .ui-popup').popup('close'); setTimeout(function () { alert(message.join('')) }, 250) }, timeout);
        }
    }

    function createMarker(extension, mapView, location, title, row) {
        var that = extension,
            mapInfo = mapView.data('data-map'),
            dataView = that.dataView(),
            marker = new google.maps.Marker({
                map: mapInfo.map,
                position: location,
                title: title
            });
        google.maps.event.addListener(marker, 'click', function () {
            that.tap({ row: row }, 'none');
            var map = mapInfo.map,
                markers = mapInfo.markers,
                mapPoint = fromLatLngToPoint(marker.position, map),
                markerAction,
                contextOption, usedIcons = ['location', 'navigation', 'arrow-r', 'arrow-l'],
                popupOptions = mapPoint && { x: mapPoint.x + mapView.offset().left, y: mapPoint.y + mapView.offset().top },
                popupIsClosing,
                popup = $('<div class="ui-content app-popup-message app-map-info"/>').popup({
                    history: !isDesktop(),
                    arrow: mapPoint ? 't,l,r,b' : null,
                    theme: 'a',
                    overlayTheme: 'b',
                    positionTo: mapPoint ? 'origin' : 'window',
                    afteropen: function () {
                        popupIsOpened(null, popup);
                        //popup.parent().prev().removeClass('in');
                        if (mapInfo.infoWidth != null) {
                            if (popup.width() < mapInfo.infoWidth && popupOptions) {
                                popup.width(mapInfo.infoWidth);
                                popup.popup('reposition', popupOptions);
                            }
                            mapInfo.infoWidth = null;
                        }
                        yardstick(list);
                        selectMarker(mapInfo, marker);
                        animateMarker(marker);
                    },
                    afterclose: function () {
                        list.listview('destroy').remove();
                        popup.find('.ui-btn').data('data-context', null);
                        destroyPopup(popup);
                        switch (markerAction) {
                            case 'location':
                                mapInfo.fit = false;
                                marker.setAnimation(null);
                                if (map.getZoom() >= 17) {
                                    var streetView = map.getStreetView()
                                    if (streetView && streetView.getVisible()) {
                                        streetView.setVisible(false)
                                        google.maps.event.trigger(marker, 'click');
                                    }
                                    else {
                                        mapInfo.fit = true;
                                        fitMarkersOnMap(mapInfo);
                                    }
                                    animateMarker(marker);
                                }
                                else {
                                    map.setZoom(17);
                                    map.panTo(marker.position);
                                    animateMarker(marker);
                                }
                                break;
                            case 'next':
                            case 'prev':
                                var markerIndex = -1;
                                $(markers).each(function (index) {
                                    if (this == marker) {
                                        markerIndex = index;
                                        return true;
                                    }
                                });
                                if (markerIndex != -1) {
                                    if (markerAction == 'next')
                                        markerIndex++;
                                    else
                                        markerIndex--;
                                    if (markerIndex < 0)
                                        markerIndex = markers.length - 1;
                                    if (markerIndex >= markers.length)
                                        markerIndex = 0;
                                    selectMarker(mapInfo, markers[markerIndex]);
                                    map.panTo(mapInfo.selected.position);
                                    google.maps.event.trigger(mapInfo.selected, 'click');
                                }
                                break;
                            case 'execute':
                                setTimeout(function () {
                                    contextOption.callback();
                                }, 100);
                                break;
                            case 'menu':
                                popupOptions.context = [{
                                    text: mapInfo.selected.title, icon: 'back', callback: function () {
                                        google.maps.event.trigger(mapInfo.selected, 'click');
                                    }
                                }];
                                showRowContext(null, popupOptions);
                                break;
                            default:
                                animateMarker(marker);
                        }
                    }
                }),
                        list = $('<ul class="app-listview"/>').appendTo(popup),
                        item = $('<li data-icon="false"/>').appendTo(list),
                link = $('<a/>').appendTo(item),
                toolbar = $('<div class="app-map-info-toolbar"/>').appendTo(popup),
                itemAddress = createItemAddress(dataView);
            createCardMarkup(dataView, row, that.itemMap(), null, item, link);
            list.listview();
            if (settings.displayDensity == 'Comfortable')
                popup.addClass('app-density-compact');
            else if (settings.displayDensity == 'Compact')
                popup.addClass('app-density-condensed');

            $('<a class="ui-btn ui-btn-inline ui-btn-icon-notext ui-corner-all ui-icon-dots"/>').appendTo(toolbar).attr('title', resourcesMobile.More);

            if (map.getZoom() >= 17) {
                if (markers.length > 1)
                    $('<a class="app-btn-map ui-btn ui-btn-inline ui-btn-icon-notext ui-corner-all ui-icon-zoomout"/>').appendTo(toolbar).attr('title', resourcesMobile.ZoomOut);
            }
            else
                $('<a class="app-btn-map ui-btn ui-btn-inline ui-btn-icon-notext ui-corner-all ui-icon-zoomin"/>').appendTo(toolbar).attr('title', resourcesMobile.ZoomIn);

            $('<a class="app-btn-map ui-btn ui-btn-inline ui-btn-icon-notext ui-corner-all ui-icon-navigation" target="_blank"/>').appendTo(toolbar)
                .attr({ 'title': resourcesMobile.Directions, 'href': rowToAddressUrl(row, createItemAddress(dataView), 'to') });


            if (mapInfo.markers.length > 1) {
                $('<a class="app-btn-map ui-btn ui-btn-inline ui-btn-icon-notext ui-corner-all ui-icon-arrow-l"/>').appendTo(toolbar).attr('title', resourcesPager.Previous);
                $('<a class="app-btn-map ui-btn ui-btn-inline ui-btn-icon-notext ui-corner-all ui-icon-arrow-r"/>').appendTo(toolbar).attr('title', resourcesPager.Next);
            }

            context = [];
            mobile.navContext(context, false);
            $(context).each(function (index) {
                var option = this;
                if ((option.icon || option.command == 'Select') && option.icon != 'dots' && !option.navigateTo && !option.system && option.callback && usedIcons.indexOf(option.icon) == -1) {
                    link.data('data-context', option);
                    return false;
                }
            });

            popup.popup('open', popupOptions)
                .on('vclick', '.ui-btn', function (event) {
                    var link = $(event.target).closest('a');
                    callWithFeedback(link, function () {
                        if (!popupIsClosing) {
                            if (link.is('.ui-icon-zoomin,.ui-icon-zoomout'))
                                markerAction = 'location';
                            else if (link.is('.ui-icon-arrow-l')) {
                                markerAction = 'prev';
                                mapInfo.infoWidth = popup.width();
                            }
                            else if (link.is('.ui-icon-arrow-r')) {
                                markerAction = 'next';
                                mapInfo.infoWidth = popup.width();
                            }
                            else if (link.is('.ui-icon-dots'))
                                markerAction = 'menu';
                            else if (link.is('.ui-icon-navigation'))
                                openHref(link.attr('href'));
                            else {
                                contextOption = link.data('data-context');
                                if (contextOption)
                                    markerAction = 'execute';
                            }
                            if (markerAction) {
                                closePopup(popup);
                                popupIsClosing = true;
                            }
                        }
                    });
                    return false;
                })
                .on('vclick', 'li', function () {
                    markerAction = true;
                    closePopup(popup);
                    return false;
                });
        });
        mapInfo.markers.push(marker);
        return marker;
    }

    function selectMarker(mapInfo, marker) {
        if (mapInfo.selected)
            mapInfo.selected.setIcon(null);
        mapInfo.selected = marker;

        if (marker)
            marker.setIcon('http://mt.google.com/vt/icon?psize=30&font=fonts/arialuni_t.ttf&color=ff304C13&name=icons/spotlight/spotlight-waypoint-a.png&ax=43&ay=48&text=%E2%80%A2');

        //function pinsymbol(color, strokecolor) {
        //    return {
        //        path: 'm 0,0 c -2,-20 -10,-22 -10,-30 a 10,10 0 1,1 10,-30 c 10,-22 2,-20 0,0 z m -2,-30 a 2,2 0 1,1 4,0 2,2 0 1,1 -4,0',
        //        fillcolor: color,
        //        fillopacity: 1,
        //        strokecolor: strokecolor,
        //        strokeweight: 1,
        //        scale: 3
        //    };
        //}
        //if (marker)
        //    marker.setIcon(pinsymbol('#66cc33', '#336600'));
    }

    function animateMarker(marker, timeout, animation) {
        if (typeof timeout == 'undefined')
            timeout = 755;
        marker.setAnimation(animation || google.maps.Animation.BOUNCE);
        if (timeout)
            setTimeout(function () {
                marker.setAnimation(null);
            }, timeout);
    }

    function fromLatLngToPoint(latLng, map) {
        var bounds = map.getBounds(),
            projection = map.getProjection(),
            topRight = projection.fromLatLngToPoint(bounds.getNorthEast()),
            bottomLeft = projection.fromLatLngToPoint(bounds.getSouthWest()),
            scale = Math.pow(2, map.getZoom()),
            worldPoint = projection.fromLatLngToPoint(latLng),
            horizOffset = 0;
        if (worldPoint.x < bottomLeft.x || bottomLeft.x == 0) {
            horizOffset = $(map.getDiv()).width() / 2;
            bottomLeft = projection.fromLatLngToPoint(bounds.getCenter());
        }
        return new google.maps.Point((worldPoint.x - bottomLeft.x) * scale + horizOffset, (worldPoint.y - topRight.y) * scale);
    }

    function popupIsOpened(uiElement, popup) {
        var container = popup.closest('.ui-popup-container'),
            promo = mobile.promo();
        $body.addClass('app-has-popup-open');
        clearHtmlSelection();
        if (promo.is(':visible'))
            promo.addClass('app-hidden');
        if (!promo.is('.app-btn-promo-cancel'))
            mobile.promo(false);
    }

    function closePopup(popup) {
        popup.popup('close');
    }

    function destroyPopup(popup) {
        unRegisterPanelScroller(popup);
        $body.removeClass('app-has-popup-open');
        popup.data('position-options', null).popup('destroy').remove();
        var promo = mobile.promo();
        if (promo.is('.app-hidden')) {
            promo.removeClass('app-hidden');
            if (!promo.is('.ui-disabled'))
                promo.show();
        }
    }

    function clearListView(listview) {
        listview.find('a').data('data-context', null);
        listview.find('li').remove();
    }

    function destroyListView(listview) {
        clearListView(listview);
        listview.off('vclick').listview('destroy');
    }

    function showRowContext(uiElement, options) {
        uiElement = $(uiElement);
        var echo = uiElement.closest('.app-echo'),
            pageId = echo.length ? echo.attr('data-for') : null,
            pageInfo = mobile.pageInfo(pageId),
            extension = pageInfo.dataView.extension(),
            context = options && options.context,
            popup = $('<div class="app-popup app-popup-listview app-popup-icon-left" data-theme="a"></div>'),
            listview,
            callback, closing;

        function createOptions(includeSystemOptions) {
            var systemOptions = [];
            $(context).each(function () {
                var option = this,
                    icon = option.icon,
                    item;
                if (option.system) {
                    if (includeSystemOptions && icon != 'search' && icon != 'sort' && icon != 'filter' && icon != 'dots')
                        systemOptions.push(option);
                }
                else if (option.text) {
                    item = $('<li/>').appendTo(listview);
                    $('<a/>').appendTo(item).text(option.text).data('data-context', option.callback);
                    item.attr('data-icon', icon || 'carat-r');
                }
            });
            if (includeSystemOptions && systemOptions.length) {
                createDivider();
                $(systemOptions).each(function () {
                    var sysOption = this,
                        sysItem = $('<li/>').appendTo(listview).attr('data-icon', sysOption.icon);
                    $('<a/>').appendTo(sysItem).text(sysOption.text).data('data-context',
                       sysOption.href ?
                            function () {
                                openHref(sysOption.href);
                            }
                            : sysOption.callback);
                });
            }

        }

        function createDivider() {
            var lastItem = listview.find('li:last');
            if (lastItem.length && !lastItem.is('[data-role="list-divider"]'))
                $('<li data-role="list-divider"/>').appendTo(listview);
        }

        uiElement.addClass('app-selected');

        listview = $('<ul class="app-listview"/>').appendTo($('<div class="ui-panel-inner"></div>').appendTo($('<div class="ui-content"></div>').appendTo(popup)));

        if (extension.lookupInfo()) {
            context = [];
            extension.context(context);
            createOptions();
        }
        else {
            // create any default options
            createOptions();


            // "ActionColumn" scope
            if (!options || options.autoPopulate != false) {
                context = [];
                extension.context(context, ['ActionColumn']);
                if (context.length) {
                    createDivider();
                    createOptions();
                }

                // "Grid" scope
                createDivider()
                context = [];
                extension.context(context, ['Grid']);
                createOptions(true);
            }
        }

        listview.listview().on('vclick', function (event) {
            var link = $(event.target).closest('a');
            if (link.length && !closing) {
                closing = true;
                callWithFeedback(link, function () {
                    callback = link.data('data-context');
                    closePopup(popup);
                });
            }
        });
        activeLink();
        configurePopupListview(popup);
        mobile.promo(false);
        popup.popup({
            history: !isDesktop(),
            transition: 'fade',
            tolerance: 3,
            arrow: isDesktop() ? 't,b,l,r' : 'b,t,l,r',
            overlayTheme: 'b',
            //positionTo: uiElement,
            afteropen: function () {
                popupIsOpened(uiElement, popup);
            },
            afterclose: function () {
                uiElement.removeClass('app-selected');
                setTimeout(function () {
                    destroyListView(listview);
                    destroyPopup(popup);
                    if (callback)
                        callback();
                }, 100);
            }
        });
        registerPanelScroller(popup);
        popup.popup('open', safePoint({ x: options && options.x || uiElement.offset().left + uiElement.outerWidth() / 2, y: options && options.y || uiElement.offset().top + Math.ceil(uiElement.outerHeight(true) / 3 * 2) }));
    }

    function showFieldValues(anchor, dataView, fieldName, values, commit, rollback) {
        var oldFilter = dataView._filter,
            isMapped = !dataView._id,
            advancedSearchFilter = !isMapped && dataView.viewProp('advancedSearchFilter');
        // configure filter and disable advanced search
        dataView._filter = values && [fieldName + ':$in$' + values] || [];

        if (!isMapped)
            dataView.viewProp('advancedSearchFilter', null);
        // show values
        showFieldContext(anchor, {
            valuesOnly: true,
            dataView: dataView,
            field: fieldName,
            afterclose: function () {
                // restore filter and advanced search
                dataView._filter = oldFilter;
                if (!isMapped)
                    dataView.viewProp('advancedSearchFilter', advancedSearchFilter)
                if (rollback)
                    rollback();
            },
            callback: function (fieldName, link) {
                if (commit)
                    commit(composeValueFilter(dataView, fieldName, link));
            }
        });
    }


    function showFieldContext(uiElement, options) {
        var echo = uiElement.closest('.app-echo'),
            pageId = echo.length ? echo.attr('data-for') : null,
            pageInfo = mobile.pageInfo(pageId),
            dataView = options.dataView || pageInfo.dataView,
            fieldName = options.field || uiElement.attr('data-field-name'),
            field = dataView.findField(fieldName),
            originalField = dataView.findFieldUnderAlias(field),
            sortOrder = (sortExpression(dataView, fieldName) || '').toLowerCase(),
            context = [], sortContext = [], filterContext,
            allowSorting = field.AllowSorting && !options.valuesOnly,
            allowFilter = field.AllowQBE,
                popupPosition;
        if (!(allowSorting || allowFilter))
            return;

        function trimToApplyButton(list, callback) {
            $(list).each(function (index) {
                var option = this,
                    itemClassName = option.itemClassName;
                if (itemClassName && itemClassName.indexOf('app-btn-apply') != -1) {
                    list.splice(0, index);
                    this.callback = callback;
                    return false;
                }
                else if (option.animate) {
                    list.splice(0, index);
                    return false;
                }
            });
        }

        // enumerate sort options
        if (allowSorting)
            sortContext = [
                {
                    text: fieldSortOrderText(field, 'asc'),
                    icon: sortOrder == 'asc' ? 'check' : 'false',
                    callback: function () {
                        mobile.contextScope(pageId);
                        sortExpression(dataView, fieldName, sortOrder == 'asc' ? false : 'asc');
                        updateSortExpressionIfChanged();
                        mobile.contextScope(null);
                    }
                },
                {
                    text: fieldSortOrderText(field, 'desc'),
                    icon: sortOrder == 'desc' ? 'check' : 'false',
                    callback: function () {
                        mobile.contextScope(pageId);
                        sortExpression(dataView, fieldName, sortOrder == 'desc' ? false : 'desc');
                        updateSortExpressionIfChanged();
                        mobile.contextScope(null);
                    }
                }
            ];

        // enumerate field filters
        if (allowFilter) {
            filterContext = configureFilter(originalField);
            if (allowSorting)
                filterContext.splice(0, 0, {});
            if (options.valuesOnly)
                trimToApplyButton(filterContext, options.callback);
        }

        if (sortContext)
            context = context.concat(sortContext);
        if (filterContext)
            context = context.concat(filterContext);

        popupPosition = {
            x: options && options.x || uiElement.offset().left + uiElement.outerWidth() / 2,
            y: options && options.y || uiElement.offset().top + uiElement.outerHeight(true) * 3 / 4
        }

        showListPopup({
            items: context, anchor: uiElement, title: options.valuesOnly ? null : uiElement.text(),
            x: popupPosition.x,
            y: popupPosition.y,
            scope: dataView._id,
            afteropen: function () {
                var popup = this;
                if (progressIndicatorInPopup().length)
                    dataView._loadListOfValues(null, originalField.Name, field.Name, function () {
                        var indicator = progressIndicatorInPopup(),
                            listview = indicator.closest('.ui-listview'),
                            option = indicator.length && indicator.data('data-context'),
                            doHideShow = isDesktop();
                        if (option && dataView._id == option.context.id && originalField.Name == option.context.field) {
                            if (doHideShow)
                                listview.hide();
                            var newFilterContext = configureFilter(originalField);
                            if (options.valuesOnly)
                                trimToApplyButton(newFilterContext, options.callback);

                            clearListView(listview);
                            renderListViewOptions(listview, sortContext.concat(newFilterContext), options);
                            listview.listview('refresh');
                            if (doHideShow)
                                listview.show();
                            popup.popup('reposition', popupPosition);
                        }
                    });
            },
            afterclose: function () {
                if (options.afterclose)
                    options.afterclose();
            }
        });
    }


    function renderListViewOptions(listview, context, options) {
        var divider;
        $(context).each(function () {
            var option = this,
                item, link;
            if (option.text) {
                divider = false;
                item = $('<li/>').appendTo(listview).attr('data-icon', option.icon || options.defaultIcon || 'false');
                if (option.disabled)
                    item.addClass('ui-disabled');
                if (option.itemClassName)
                    item.addClass(option.itemClassName);
                if (option.callback) {
                    link = $('<a/>').appendTo(item).text(option.text).data('data-context', option);
                    if (option.keepOpen) {
                        link.addClass('app-keep-open');
                        if (!option.animate)
                            link.addClass('app-btn-icon-transparent');
                    }
                    if (option.linkClassName)
                        link.addClass(option.linkClassName);
                    if (option.animate)
                        link.addClass('app-animated app-animation-spin');
                }
                else
                    item.text(option.text).addClass('app-list-instruction ui-li-divider ui-bar-a');
                if (option.visible) {
                    item.attr('data-visible', 'true');
                    link.addClass('app-selected');
                }
            }
            else if (!divider) {
                divider = true;
                $('<li data-role="list-divider"/>').appendTo(listview);
            }
        });
        if (divider)
            listview.find('li:last').remove();
    }


    function showListPopup(options) {
        var popup = $('<div class="app-popup app-popup-listview" data-theme="a"></div>'),
            uiElement = $(options.anchor),
            inner,
            listview,
            selectedOption, selectedLink, closing,
            context = options.items || [],
            anchorIsPromo = uiElement.is('.app-btn-promo'),
            positionOptions;

        clearHtmlSelection();

        if (options.x == null && uiElement.length)
            options.x = Math.ceil(uiElement.offset().left + (options.xOffset ? options.xOffset : uiElement.outerWidth() / 2));
        if (options.y == null && uiElement.length)
            if (options.yOffset == 'bottom')
                options.y = Math.ceil(uiElement.offset().top + (isDesktop() ? uiElement.outerHeight() : uiElement.outerHeight() / 2));
            else if (typeof options.yOffset == 'number')
                options.y = Math.ceil(uiElement.offset().top + uiElement.outerHeight() * (isDesktop ? options.y : (1 - options.y)));

        if (options.iconPos == 'left')
            popup.addClass('app-popup-icon-left');

        if (options.title)
            $('<h1 class="ui-title"/>').appendTo($('<div class="ui-header ui-bar-a"/>').appendTo(popup)).text(options.title);
        inner = $('<div class="ui-panel-inner"/>').appendTo($('<div class="ui-content"/>').appendTo(popup));
        listview = $('<ul class="app-listview"/>').appendTo(inner);

        renderListViewOptions(listview, context, options);

        function getPopupOptions() {
            return safePoint({ x: options && options.x || uiElement && uiElement.offset().left + uiElement.outerWidth() / 2, y: options && options.y || uiElement && uiElement.offset().top + uiElement.outerHeight(true) * 3 / 4 });
        }

        function executeCallback(item, link) {
            var oldScope = mobile.contextScope(),
                callback = item.callback;
            if (options.scope)
                mobile.contextScope(options.scope);
            if (callback)
                callback(item.context, link);
            mobile.contextScope(oldScope);
        }

        listview.listview().on('vclick', function (event) {
            var link = $(event.target).closest('a');
            if (link.length && !closing && clickable(link)) {
                closing = true;
                callWithFeedback(link, function () {
                    selectedOption = link.data('data-context');
                    selectedLink = link;
                    if (selectedOption.keepOpen) {
                        executeCallback(selectedOption, selectedLink);
                        selectedOption = null;
                        selectedLink = null;
                        closing = false;
                    }
                    else
                        closePopup(popup);
                });
            }
            return false;
        });
        if (!anchorIsPromo)
            mobile.promo(false);
        popup.popup({
            animation: false,
            history: !isDesktop(),
            arrow: options.arrow || uiElement && (isDesktop() ? 't,b,l,r' : 'b,t,l,r'),
            overlayTheme: 'b',
            tolerance: options.tolerance != null ? options.tolerance : 5,
            transition: 'fade',
            //positionTo: uiElement,
            afteropen: function (event, ui) {
                popupIsOpened(null, popup);
                if (options.afteropen)
                    options.afteropen.call(popup);
                if (isDesktop())
                    inner.focus();
            },
            afterclose: function () {
                if (uiElement)
                    uiElement.removeClass('app-selected');
                if (options.afterclose)
                    options.afterclose.call(popup);
                setTimeout(function () {
                    if (selectedOption)
                        executeCallback(selectedOption, selectedLink);
                    selectedOption = null;
                    selectedLink = null;
                    clearListView(listview);
                    destroyListView(listview);
                    destroyPopup(popup);
                }, 100);
            },
            beforeposition: function () {
                if (isDesktop()) {
                    var w = inner.width('').width() + 20;
                    if (inner.height() < listview.outerHeight(true)) {
                        inner.css({ width: w });
                        popup.css({ minWidth: w, maxWidth: 'auto' });
                    }
                }
            },
        });
        registerPanelScroller(popup);

        if (context.length == 0) {
            popup.find('.ui-content').hide();
            popup.find('.ui-header').css({ 'border-bottom-width': 0, 'margin-bottom': '.25em' });
        }

        if (uiElement) {
            if (!anchorIsPromo && options.highlightAnchor != false)
                uiElement.addClass('app-selected');

            var uiElementOffset = uiElement.offset(),
                screenHeight = $mobile.getScreenHeight(),
                toolbarHeight = mobile.toolbar().outerHeight(),
                spaceAbove = uiElementOffset.top/* - toolbarHeight*/,
                spaceBelow = screenHeight - (uiElementOffset.top + uiElement.outerHeight());
            inner.css({ maxHeight: Math.max(spaceAbove - toolbarHeight * 2, spaceBelow - toolbarHeight * 2, 50) });
        }

        configurePopupListview(popup);
        positionOptions = getPopupOptions(true);

        var visibleItem = listview.find('li[data-visible="true"]')
        if (visibleItem.length) {
            if (inner.offset().top + inner.outerHeight() < visibleItem.offset().top + visibleItem.outerHeight())
                inner.scrollTop(visibleItem.offset().top - inner.offset().top - (inner.outerHeight() - visibleItem.outerHeight()) / 2);
        }
        if (anchorIsPromo)
            mobile.promo().show();

        $body.focus();
        popup.data('position-options', positionOptions).popup('open', positionOptions);
    }

    function showMoreButtonsInForm(uiElement) {
        var context = [];
        $(uiElement).closest('.app-bar-buttons').find('.ui-btn:not(:visible):not(.app-btn-more)').each(function () {
            var btn = $(this);
            context.push({
                text: btn.text(), callback: function () {
                    btn.trigger('vclick');
                }
            });
        });
        showListPopup({ anchor: uiElement, items: context, y: uiElement.offset().top + Math.ceil(uiElement.outerHeight() / 4 * 3), tolerance: 3 });
    }

    function defaultPopupOptions(transition) {
        return {
            overlayTheme: 'b',
            history: !isDesktop(),
            transition: transition || 'pop',
            positionTo: 'window',
            afteropen: function () {
                var callback = popupOpenCallback;
                if (callback)
                    setTimeout(function () {
                        callback();
                    }, 200);
                popupOpenCallback = null;
            },
            afterclose: function () {
                var callback = popupCloseCallback;
                if (callback)
                    setTimeout(function () {
                        callback();
                    }, 100);
                popupCloseCallback = null;
            }
        };
    }

    function filterDataViewByFieldValue(context) {
        var dataView = $app.find(context.id),
            field = dataView.findField(context.field),
            op = context.op;
        dataView.removeFromFilter(field);
        if (op != '$clear') {
            if (op.startsWith('$'))
                op += '$';
            dataView._filter.push(context.field + ':' + op + dataView.convertFieldValueToString(field, context.value));
        }
        applyDataFilter(dataView);
    }

    function handleFieldContextMenu(dataView, event) {
        var target = $(event.target).closest('.app-field'),
            link = target.closest('a'),
            field, fieldName, fieldValue, text,
            filterDefList,
            currentFilter,
            items = [];

        function createItem(op, text) {
            var newFilter = field.Name + ':' + op;
            if (op.startsWith('$'))
                newFilter += '$';
            newFilter += dataView.convertFieldValueToString(field, fieldValue);
            if (currentFilter != newFilter)
                items.push({ text: $app.filterDef(filterDefList, op).Text + (text ? ' ' + text : ''), context: { id: dataView._id, field: fieldName, op: op, value: fieldValue }, callback: filterDataViewByFieldValue });
        }

        if (target.length) {
            dataContext = link.data('data-context');
            fieldName = target.attr('class').match(/app\-field\-(\w+)/);
            if (fieldName)
                fieldName = fieldName[1];
            if (fieldName) {
                event.preventDefault();
                field = dataView.findField(fieldName);
                if (!field.AllowQBE)
                    return false;
                filterDefList = resourcesData.Filters[field.FilterType].List;
                fieldValue = dataContext.row[field.Index];

                $(dataView._filter).each(function () {
                    var f = this;
                    if (f.startsWith(fieldName + ':')) {
                        currentFilter = f;
                        items.push(
                            { text: String.format(resourcesHeaderFilter.ClearFilter, field.HeaderText), icon: 'delete', context: { id: dataView._id, field: fieldName, op: '$clear' }, callback: filterDataViewByFieldValue },
                            {})
                        return true;
                    }
                });
                if (fieldValue == null) {
                    createItem('$isempty');
                    createItem('$isnotempty');
                }
                else {
                    text = field.text(fieldValue);
                    if (field.FilterType == 'Text')
                        text = '\"' + text + '\"';
                    if (field.FilterType == 'Text') {
                        createItem('=', text);
                        createItem('<>', text);
                        createItem('$contains', text);
                        createItem('$doesnotcontain', text);
                    }
                    else if (field.FilterType == 'Logical') {
                        createItem('$true');
                        createItem('$false');
                    }
                    else {
                        // Number and Date
                        createItem('=', text);
                        createItem('<>', text);
                        createItem('<=', text);
                        createItem('>=', text);
                        createItem('<', text);
                        createItem('>', text);
                    }
                }
                if (items.length)
                    showListPopup({ anchor: target, items: items, x: event.pageX });
                return false;
            }
        }
        return true;
    }

    function handleAppButtonClick(event) {
        blurFocusedInput();
        var link = $(event.target),
            icon = link.data('icon'),
            iconList;
        if (link.is('.app-btn-promo')) {
            iconList = link.data('icon-list');
            if (iconList) {
                callWithFeedback(link, function () {
                    var options = [],
                        promoIcon = 'ui-icon-' + link.data('icon'),
                        icon, text, desc;
                    if (link.is('.app-btn-promo-cancel')) {
                        $('.ui-popup-screen.in').trigger('vclick');
                        return false;
                    }
                    $(iconList.icons).each(function () {
                        icon = this;
                        if (!icon.match(/(delete|minus|trash)/)) {
                            text = iconList.labels[icon].split(/\n/);
                            options.push({
                                text: text[0], desc: text[1], icon: icon, context: icon, callback: function (contextIcon) {
                                    mobile.executeInContext(contextIcon);
                                }
                            });
                        }
                    });
                    link.addClass('ui-icon-delete app-btn-promo-cancel').removeClass(promoIcon);
                    showListPopup({
                        anchor: mobile.promo(), items: options, iconPos: 'left', y: link.offset().top - 1,
                        afterclose: function () {
                            link.removeClass('ui-icon-delete app-btn-promo-cancel').addClass(promoIcon);
                        }
                    });
                });
                return false;
            }
            else if (advancedSearchPageIsActive()) {
                callWithFeedback(link, performAdvancedSearch);
                return false;
            }
        }
        if (icon == 'search') {
            var pageInfo = mobile.pageInfo(),
                dataView = pageInfo && pageInfo.dataView;
            if (dataView) {
                if (dataView.extension().useAdvancedSearch() && !_pendingQueryText)
                    callWithFeedback(link, function () {
                        startSearch(dataView, _pendingQueryText);
                    });
                else
                    startSearch(dataView);
            }
        }
        else {
            callWithFeedback(link, function () {
                mobile.executeInContext(icon);
            });
        }
        return false;
    }

    function handleLinkClick(event) {
        if (event.isDefaultPrevented())
            return;
        var eventTarget = $(event.target),
            link = eventTarget.is('a') ? eventTarget : eventTarget.closest('a'),
            href = link.attr('href'),
            target;
        if (isInTransition)
            return;
        switch (href) {
            case '#app-menu':
                target = '#app-btn-menu';
                break;
            case '#app-context':
                target = '#app-btn-context';
                break;
            case '#app-back':
                target = function () {
                    history.go(-1);
                };
                break;
            case '#app-details':
                target = function () {
                    var pageInfo = mobile.pageInfo(),
                        extension;
                    if (pageInfo && pageInfo.dataView) {
                        extension = pageInfo.dataView.extension();
                        extension.command(extension.commandRow(), 'Select');
                        _pendingPageText = link.attr('data-field-text');
                        pageInfo.dataView._viewDetails(link.attr('data-field-name'));
                    }
                };
                break;
            case '#app-lookup':
                //trying to trap double clicks here:
                //if (window.counter == null)
                //    window.counter = 0;
                //window.counter++;
                //if (window.counter % 2 == 0)
                //    return false;
                target = function () {
                    var context = link.data('data-context');
                    blurFocusedInput();
                    mobile.showLookup(context);
                    context.query = null;
                    activeLink(link, false);
                };
                break;
            case '#app-action':
                target = function () {
                    var icon = link.attr('class').match(/ui-icon-([\w\-]+)/) || [0, 'carat-r'];
                    if (link.is('.app-btn-more'))
                        showMoreButtonsInForm(link);
                    else if (icon) {
                        if (icon[1] == 'carat-r')
                            mobile.executeInContext(null, link.text());
                        else
                            mobile.executeInContext(icon[1]);
                    }
                };
                break;
            default:
                if (href) {
                    if (href.match(/^tel/))
                        target = function () {
                            openHref(href);
                        }
                    else if (!link.attr('target')) {
                        var contentType = link.attr('data-content-type'),
                            previewPopup;
                        if (contentType && contentType.match(/^image/))
                            target = function () {
                                previewPopup = $('#app-popup-image');
                                if (!previewPopup.length) {
                                    previewPopup = $(
                                        '<div id="app-popup-image" class="app-popup-image" data-role="popup" data-overlay-theme="b" data-theme="b" data-position-to="window">' +
                                        '<a href="#app-back" data-rel="back" class="ui-btn ui-corner-all ui-shadow ui-btn-b ui-icon-delete ui-btn-icon-notext ui-btn-right"/>' +
                                        '<img class="app-image-preview" style="max-width:10000px"/><div class="app-image-preview-box"></div>' +
                                        '</div>').appendTo($body).popup(defaultPopupOptions('none')).popup('option', 'history', true);
                                    previewPopup.find('.app-image-preview').one('load', function (event) {
                                        var image = $(event.target);
                                        setTimeout(function () {
                                            busyIndicator(false);
                                            image.width('').height('');
                                            var imageBox = previewPopup.find('.app-image-preview-box'),
                                                screen = mobile.screen(),
                                                imageWidth = image.width(),
                                                maxImageWidth = screen.width * .9,
                                                imageHeight = image.height(),
                                                maxImageHeight = screen.height * .9;
                                            if (imageWidth > maxImageWidth) {
                                                imageHeight *= maxImageWidth / imageWidth;
                                                imageWidth = maxImageWidth;
                                                if (imageHeight > maxImageHeight) {
                                                    imageWidth *= maxImageHeight / imageHeight;
                                                    imageHeight = maxImageHeight;
                                                }
                                            }
                                            else if (imageHeight > maxImageHeight) {
                                                imageWidth *= maxImageHeight / imageHeight;
                                                imageHeight = maxImageHeight;
                                            }
                                            image.hide();
                                            imageBox.css({
                                                'background': '',
                                                'width': imageWidth + 'px',
                                                'height': imageHeight + 'px'
                                            }).show();
                                            previewPopup.popup('reposition', { positionTo: 'window' });
                                            imageBox.css({
                                                'background': String.format('url({0})', image.attr('src')),
                                                'background-size': String.format('{0}px {1}px', imageWidth, imageHeight)
                                            });
                                        }, 100);
                                    });
                                }
                                busyIndicator(true);
                                previewPopup.find('.app-image-preview-box').hide();
                                previewPopup.find('.app-image-preview').attr('src', '').width(100).height('').show().attr('src', href);
                                popupCloseCallback = function () {
                                    destroyPopup(previewPopup);
                                };
                                previewPopup.popup('open');
                            }
                            /*else if (href == '#') {
                            animatedScroll($mobile.activePage.find('.app-wrapper'), 0);
                            }*/
                        else {
                            var loc = $mobile.path.parseUrl(href),
                                locationHash = loc.hash;
                            if (loc.host)
                                target = function () {
                                    // external link
                                    if (busyIndicator()) return;
                                    if (loc.host == 'maps.apple.com' || loc.host == 'maps.google.com' || link.is('[rel="external"]'))
                                        openHref(href);
                                    else {
                                        var pageId = loc.pathname.replace(/\//g, '-').substring(1) || loc.host.replace(/\W/g, '-'),
                                            text = loc.filename.replace(/\W/g, ' '),
                                            page = mobile.page(pageId),
                                            iframe = page.find('iframe');
                                        busyIndicator(true);
                                        if (iframe.length)
                                            iframe.remove();
                                        iframe = $('<iframe class="app-page-external"/>').attr('src', href).appendTo(page.find('.app-wrapper').addClass('app-wrapper-external'))
                                            .load(function () {
                                                if (getActivePageId() == pageId)
                                                    busyIndicator(false);
                                                else
                                                    setTimeout(function () {
                                                        if (!mobile.pageInfo(pageId))
                                                            mobile.pageInfo({ id: pageId, /*text: text, headerText: text,*/external: true });
                                                        mobile.changePage(pageId);
                                                    }, 100);

                                            });
                                        if (iOS)
                                            page.find('.app-wrapper').css('overflow', 'auto');
                                    }
                                }
                            else if (!link.closest('.ui-panel-inner').length) {
                                if (locationHash) {
                                    if (link.closest('.app-content-framework').length) {
                                        // hash link
                                        if (eventTarget.data('app-click-test'))
                                            return;
                                        else {
                                            eventTarget.data('app-click-test', true);
                                            $mobile.linkBindingEnabled = false;
                                            event.type = 'click';
                                            $(document).trigger(event);
                                            eventTarget.data('app-click-test', null);
                                            $mobile.linkBindingEnabled = true;
                                            if (!event.isDefaultPrevented()) {
                                                if (locationHash == '#')
                                                    target = function () {
                                                        animatedScroll($mobile.activePage.find('.app-wrapper'), 0);
                                                    };
                                                else {
                                                    var section = locationHash && locationHash.length > 1 && $mobile.activePage.find(locationHash + ',a[name="' + locationHash.substring(1) + '"]'),
                                                        wrapper = $mobile.activePage.find('.app-wrapper'),
                                                        top;
                                                    if (section && section.length)
                                                        target = function () {
                                                            top = section.offset().top - (wrapper.offset().top - wrapper.scrollTop());
                                                            callWithFeedback(link, function () {
                                                                animatedScroll(wrapper, top);
                                                            });
                                                        }
                                                    else
                                                        target = function () {
                                                            if ($(locationHash).is('.ui-page'))
                                                                mobile.changePage(locationHash.substring(1));
                                                        };
                                                }
                                            }
                                        }
                                        if (target)
                                            event.preventDefault();
                                    }
                                    else if (locationHash != '#')
                                        target = function () {
                                            $mobile.navigate(locationHash);
                                        }
                                }
                                else
                                    // internal link
                                    target = function () {
                                        if (busyIndicator()) return;
                                        href = $mobile.path.convertUrlToDataUrl($mobile.path.makeUrlAbsolute(href, $mobile.path.documentBase));
                                        var targetPage = $body.find('> div[data-url]')
                                            .filter(function () {
                                                return $(this).attr('data-url') == href;
                                            }),
                                            pageTransition = link.attr('data-transition');
                                        if (link.attr('rel') == 'external') {
                                            busyBeforeUnload();
                                            location.href = href;
                                        }
                                        else if (targetPage.length)
                                            $mobile.navigate(href, { transition: pageTransition });
                                        else {
                                            busyIndicator(true);
                                            $.ajax({
                                                url: href,
                                                dataType: "html",
                                                success: function (result) {
                                                    busyIndicator(false);
                                                    var pageContent = result.match(/<td\s+id\s*=\s*"PageContent"\s*>([\s\S]+)?<\/td>\s*<td\s+id\s*="PageContent.+"\s*>/i);
                                                    if (pageContent && !result.match(/\$create\(Web.DataView|\s+data-controller\s*=\s*"/)) {
                                                        var template = pageContent[1],
                                                            pageTemplate,
                                                            scripts = new Sys.StringBuilder(),
                                                            scriptIterator = /<script.+?>([\s\S]+?)<\/script>/ig,
                                                            scriptFragment,
                                                            options,
                                                            page;
                                                        // convert template to a page
                                                        while (scriptFragment = scriptIterator.exec(template))
                                                            scripts.append(scriptFragment[1]);
                                                        template = template.replace(scriptIterator, '');
                                                        pageTemplate = $('<div></div>').appendTo($body).hide().attr('data-href', href);
                                                        pageTemplate.html(template).data('scripts', scripts.toString());
                                                        // create a page
                                                        options = { pageId: pathToId(href), selector: pageTemplate, transition: pageTransition },
                                                        page = mobile.page(options.pageId);
                                                        mobile.pageInfo({ id: options.pageId, text: options.pageId + '_main', url: href, root: true });
                                                        mobile.start(options);
                                                        // distroy the page template
                                                        pageTemplate.data('scripts', null).remove();
                                                    }
                                                    else {
                                                        busyBeforeUnload();
                                                        location.href = href;
                                                    }
                                                },
                                                error: function () {
                                                    busyIndicator(false);
                                                }
                                            });
                                        }

                                    }
                            }
                        }
                    }
                }
        }
        if (target && !mobile.busy()) {
            callWithFeedback(link, function () {
                blurFocusedInput();
                mobile.busy(false);
                if (typeof target == 'string') {
                    var selector = target;
                    target = function () {
                        $(selector).trigger('vclick');
                    }
                }
                if (!callAfterCalculate(target))
                    target();
            });
            return false;
        }
    }

    if (typeof Web == 'undefined') Web = { DataView: {} }

    Web.DataView.MobileBase = function () {
        Web.DataView.MobileBase.initializeBase(this);
    }

    Web.DataView.MobileBase.prototype = {
        initialize: function () {
        },
        show: function () {

        },
        hide: function () {

        },
        systemFilter: function () {
            return null;
        },
        reset: function (full) {

        },
        wait: function () {

        },
        dataView: function (owner) {
            if (owner == null)
                return this._dataView;
            else
                this._dataView = owner;
        },
        inserting: function () {
            return this.dataView().get_isInserting();
        },
        editing: function () {
            return this.dataView().get_isEditing();
        },
        content: function () {
            var dataView = this._dataView;
            return mobile.content(dataView._id);
        },
        commandRow: function (value) {
            if (arguments.length == 0)
                return this._commandRow;
            else {
                if (value) {
                    var row = this._commandRow = value.slice(0);
                    this.dataView()._rows = [value];
                    return row;
                }
                else
                    return value;
            }
        },
        command: function (row, commandName, argument, causesValidation, path) {
            var rowIndex = 0;
            if (row && !row.length) {
                row = null;
                rowIndex = null;
            }
            this.commandRow(row);
            var dataView = this.dataView();
            dataView.executeRowCommand(rowIndex, commandName, argument, causesValidation, path);
        },
        action: function (row, scope, actionIndex, rowIndex, groupIndex, confirmed) {
            this.commandRow(row);
            var dataView = this.dataView();
            dataView.executeAction(0, scope, actionIndex, rowIndex, groupIndex, confirmed);
        },
        itemMap: function () {
            return createItemMap(this.dataView());
        },
        stateChanged: function () {
            refreshContextSidebar();
        },
        lookupInfo: function (value) {
            var dataView = this.dataView();
            if (arguments.length) {
                dataView._lookupInfo = value;
            }
            else
                return dataView._lookupInfo;
        },
        viewDescription: function () {
            var dataView = this.dataView(),
                showDescription = dataView._showDescription != false,
                viewDescription = showDescription && dataView.get_view().HeaderText;
            viewDescription = showDescription ? dataView._formatViewText(resourcesViews.DefaultDescriptions[viewDescription], true, viewDescription) : '';
            return viewDescription.replace(/\n/g, '<p/>');
        },
        executeInContext: function (command, argument, ignoreLookup, testOnly) {
            var oldLookupInfo = this.lookupInfo(),
                context = [],
                result;
            if (ignoreLookup)
                this.lookupInfo(null);
            this.context(context);
            if (ignoreLookup)
                this.lookupInfo(oldLookupInfo);
            $(context).each(function () {
                var item = this,
                    itemCommand = item.command;
                if (itemCommand && itemCommand == command && (argument == null || item.argument == argument)) {
                    result = item;
                    if (!testOnly)
                        executeContextAction(item);
                    return false;
                }
            });
            return result;
        },
        tagged: function (tag) {
            return this.dataView().get_isTagged(tag);
        },
        filterStatus: function (brief, ignoreAdvancedSearch) {
            var that = this,
                dataView = that.dataView(),
                sb,
                searchFilter = advancedSearchFilter(dataView),
                filter = dataView ? dataView.get_filter() : null,
                isSearched = searchFilter.length > 0,
                isFiltered = dataView && filter.length > 0 && !dataView.filterIsExternal();
            if ((isFiltered || isSearched) && that.options().filterDetails) {
                sb = new Sys.StringBuilder();
                if (isSearched && !ignoreAdvancedSearch)
                    dataView._renderFilterDetails(sb, searchFilter, false);
                if (isFiltered)
                    dataView._renderFilterDetails(sb, filter, !brief);
                return sb.toString().replace(filterDetailsRegex, '').replace(filterDetailsRegex2, '\"').replace(filterDetailsRegex3, '\"$1');
            }
            return null;
        },
        aggregates: function () {
            var aggregates = this._dataView._aggregates;
            return aggregates && aggregates.length ? aggregates : null;
        },
        aggregateLabels: function () {
            var labels = [];
            $(this._dataView._fields).each(function () {
                var f = this;
                labels.push(f.Aggregate == 0 ? null : String.format(Web.DataViewResources.Grid.Aggregates[Web.DataViewAggregates[f.Aggregate]].FmtStr, '').trim());
            });
            return labels;
        },
        calculate: function (causedBy) {
        },
        afterCalculate: function (values) {
        }
    }

    /* implementation of extensions */

    Web.DataView.Extensions = {}

    /* dataview */

    Web.DataView.prototype.pageProp = function (name, value) {
        name = this._id + '_' + name;
        if (arguments.length == 1)
            return pageVariable(name);
        else
            pageVariable(name, value);
    }

    Web.DataView.prototype.viewProp = function (name, value) {
        name = (this._viewId || 'grid1') + '_' + name;
        if (arguments.length == 1)
            return this.pageProp(name);
        else
            this.pageProp(name, value);
    }

    Web.DataView.prototype.mobileUpdated = function () {
        var that = this,
            userViewId = that.pageProp('viewId'),
            userSortExpression,
            filter,
            quickFindHint;
        if (!that.get_useCase() && !that.get_lastCommandName()) {
            if (userViewId)
                that._viewId = userViewId;
            userSortExpression = that.viewProp('sortExpression'),
            filter = that.viewProp('filter');
            if (userSortExpression)
                that._sortExpression = userSortExpression;
            if (filter && filter.length)
                that._filter = (that._filter || []).concat(filter);
        }


        var activator = parseActivator($(that._element), document.title),
            info = { id: that.get_id(), text: activator.text, headerText: activator.text, dataView: that, activator: activator };
        that._pageSize = userAgent.match(/iPad;.*CPU.*OS \d_\d/i) || isDesktopClient ? 30 : 24 // 6 -debug; 24 - production; // possible page size that works for 1, 2, and 3 columns must divide by 2 and 3
        mobile.pageInfo(info);
        if (!that._hidden && !that._filterSource && !mobile._appLoaded)
            $('<a class="app-action-navigate"/>')
                .attr('href', '#' + info.id)
                .appendTo($('<li>').appendTo(mobile.pageMenu())).text(activator.text);
    }

    /* grid view */

    Web.DataView.Extensions.Grid = function (dataView) {
        return new Web.DataView.MobileGrid(dataView);
    }

    Web.DataView.Extensions.DataSheet = function (dataView) {
        return new Web.DataView.MobileGrid(dataView);
    }

    Web.DataView.MobileGrid = function (dataView) {
        Web.DataView.MobileGrid.initializeBase(this);
        this.dataView(dataView);
    }

    Web.DataView.MobileGrid.prototype = {
        initialize: function () {
            var that = this,
                style = that.dataView().pageProp('viewStyle');
            if (!style)
                if (that.tagged('view-style-map'))
                    style = 'Map';
                else if (that.tagged('view-style-list'))
                    style = 'Cards';
                else if (that.tagged('view-style-listonecolumn'))
                    style = 'List';
                else if (that.tagged('view-style-grid'))
                    style = 'Grid'
                else {
                    style = isDesktop() ? 'Grid' : 'Cards';
                    $(that._dataView._fields).each(function () {
                        if (this.OnDemand && this.OnDemandStyle == 0) {
                            style = 'Cards'; // thumbnails are detected
                            return false;
                        }
                    });
                }
            that._viewStyle = style;
        },
        options: function () {
            var dataView = this.dataView();
            return { quickFind: dataView.get_isGrid() && dataView.get_showQuickFind(), filterDetails: true };
        },
        viewStyle: function (value) {
            var that = this,
                viewStyle = that._viewStyle;
            if (arguments.length == 0)
                return viewStyle;
            var activePage = $mobile.activePage,
                originalViewStyle = viewStyle;
            that._viewStyle = value;
            if (activePage) {
                enableHeading();
                that.dataView().pageProp('viewStyle', value);
                if (originalViewStyle == 'Grid' || value == 'Grid' || originalViewStyle == 'Map' || value == 'Map') {
                    hideHeadingBar();
                    that._reset = true;
                    that._instructed = false;
                    that.dataView().sync();
                }
                else {
                    changeViewStyle(activePage.find('.app-listview'), value)
                    yardstick();
                    fetchOnDemand();
                }
            }
            refreshContextSidebar();
        },
        tap: function (value, action) {
            if (!value) return;
            var dataView = this.dataView(),
                row = value.row || value;
            if (dataView._busy()) return;
            if (dataView._hasKey()) {
                this.command(row, 'Select');
                if (action)
                    mobile.dataViewUILinks(dataView).each(function () {
                        var link = $(this),
                            dataContext = link.data('data-context');
                        if (dataContext && dataView.rowIsSelected(dataContext.row)) {
                            link.addClass('app-selected');
                            return false;
                        }
                    });
                if (!action || action == 'select') {
                    if (this.lookupInfo())
                        this.executeInContext('Select');
                    else {
                        var context = [];
                        mobile.navContext(context);
                        $(context).each(function () {
                            var option = this;
                            if (option.text && option.icon != 'dots' && !option.system) {
                                executeContextAction(option);
                                return false;
                            }
                        });
                    }
                }
            }
            else
                mobile.infoView(dataView, true, row);
            refreshContextSidebar();
        },
        clearSelection: function (updateUI) {
            var dataView = this.dataView(),
                pageInfo;
            dataView._clearSelectedKey();
            dataView._forgetSelectedRow(true);
            delete this._commandRow;
            if (updateUI) {
                $('#' + dataView._id + '_echo').find('ul[data-role="listview"] a.app-selected').removeClass('app-selected');
                $mobile.activePage.find('.app-wrapper > ul[data-role="listview"] a.app-selected').removeClass('app-selected');
                refreshEchoToolbar(dataView);
            }
            refreshContextSidebar();
        },
        quickFind: function (value) {
            var dataView = this.dataView();
            if (value != null) {
                dataView.viewProp('quickFind', value);
                dataView._executeQuickFind(value);
                persistDataFilter(dataView);
            }
            else {
                value = dataView.viewProp('quickFind') || '';
                return value;
            }
        },
        useAdvancedSearch: function (value) {
            var dataView = this.dataView(),
                useAS;
            if (arguments.length)
                dataView.viewProp('useAdvancedSearch', value);
            else {
                useAS = dataView.viewProp('useAdvancedSearch');
                if (useAS == null)
                    useAS = dataView.get_searchOnStart();
                return useAS == true;
            }
        },
        dispose: function () {
            //var listview = this.content().next('ul[data-role="listview"]');
            //listview.find('a').data('data-context', null);
            //listview.listview('destroy').remove();
            var content = this.content();
            disposeListViews(content);
            content.find('.app-map').each(function () {
                var mapView = $(this),
                    mapInfo = mapView.data('data-map');
                if (mapInfo) {
                    clearMarkers(mapInfo);
                    mapInfo.map = null;
                    mapView.data('data-map', null);
                }
            });
        },
        refresh: function () {
            var that = this,
                pageIndex = that.pageIndex(),
                dataView = that.dataView(),
                pageInfo = mobile.pageInfo(dataView._id),
                fields = dataView._fields,
                allFields = dataView._allFields,
                content = that.content(),
                page = $('#' + pageInfo.id),
                rows = that.visibleDataRows(pageIndex),
                listview = content.find('ul[data-role="listview"]'),
                pageSize = this.pageSize(),
                allowLoadAtTop = pageIndex > 0,
                allowLoadAtBottom = pageIndex < that.pageCount() - 1,
                scrollCount,
                skipClick,
                itemMap = that.itemMap(),
                showRowNumber = dataView.get_showRowNumber() == true,
                requiresReset = that._reset,
                viewStyle = that.viewStyle(),
                isGrid = viewStyle == 'Grid',
                scrollable = content.closest('.app-wrapper'),
                scrollableCover,
                initialScrollTop = scrollable.scrollTop(),
                pageHeader = scrollable.find('.app-page-header'),
                context, tabs,
                pageIsInvisible,
                hasMultipleViews,
                requiresPromoSpacing;

            if (that.echoCallback) {
                that.echoCallback();
                return;
            }

            function ensurePageVisibility(visible) {
                if (visible) {
                    pageIsInvisible = page.css('display') != 'block';
                    if (pageIsInvisible) {
                        page.css({ 'display': 'block', 'z-index': -10 });
                        resetPageHeight(page);
                        scrollable.scrollTop(initialScrollTop); // webkit does not reset scrollTop if an element is invisible
                    }
                }
                else {
                    if (pageIsInvisible) {
                        saveScrolling(page);
                        page.css({ 'display': '', 'z-index': '' });
                    }
                }
            }

            function searchOnStart() {
                that.useAdvancedSearch(true);
                dataView.set_searchOnStart(false);
                startAdvancedSearch(dataView, null)
            }

            if (!rows) {
                if (requiresReset)
                    clearListView(listview);
                dataView.goToPage(pageIndex, true);
                return;
            }
            if (pageInfo.echoId)
                if (!pageInfo.echoInitialized) {
                    refreshEcho(pageInfo.echoId);
                    if (!pageInfo.displayed)
                        pageInfo.initialized = false;
                    return;
                }


            if (requiresReset)
                pageInfo.echoChanged = true;


            if (!isInTransition && pageInfo.id != getActivePageId() && pageInfo.id != rootDataViewId && !dataView._lookupInfo) {
                executeRefreshCallback(pageInfo);
                fetchEchos();
                return;
            }

            pageInfo.displayed = true;
            pageInfo.initialized = true;

            if (!that._checkedViews) {
                that._checkedViews = true;
                context = [];
                if (enumerateAvailableViews(context, false, pageInfo) > 1) {
                    tabs = [];
                    $(context).each(function () {
                        var option = this;
                        tabs.push({ text: option.text, active: option.icon == 'checked', callback: option.callback });
                    });
                    mobile.tabs('create', { tabs: tabs, className: 'ui-header-fixed app-tabs-views', id: dataView._id + '_view-tabs', placeholder: content });
                    pageHeaderText(false, pageHeader);
                    hasMultipleViews = true;
                }
            }

            //pageHeader.attr('data-count', dataView._totalRowCount > 0 ? dataView._totalRowCount : null);
            //pageHeaderText();

            if (viewStyle == 'Map') {
                iyf();
                disposeListViews(content);
                page.find('.dv-heading').remove();
                if (!that.tagged('supports-view-style-map')) {
                    that.viewStyle(isDesktop() ? 'Grid' : 'List');
                    refreshContextSidebar();
                    return;
                }
                if (requiresReset) {
                    that._reset = false;
                    that._mapPageWindow = null;
                    var hasSelection = false;
                    $(rows).each(function () {
                        if (dataView.rowIsSelected(this)) {
                            hasSelection = true;
                            that.tap(this, 'none');
                            return false;
                        }
                    });
                    if (!hasSelection)
                        that.clearSelection();
                    else
                        dataView.raiseSelected();

                    that.refresh();
                    return;
                }
                pageHeaderText(true);
                ensurePageVisibility(true);
                var mapView = scrollable.find('> .app-map'),
                    mapInstruction = scrollable.find('> .app-map-instruction'),
                    instruction = that.instruction();
                if (!mapView.length) {
                    mapInstruction = $('<div class="app-map-instruction"/>').appendTo(scrollable).hide();
                    mapView = $('<div class="app-map"/>').appendTo(scrollable).attr('data-map-for', dataView._id).hide();
                    mobile.registerAPI('Map');
                }
                if (instruction) {
                    mapInstruction.show();
                    mapInstruction.html(instruction);
                }
                else
                    mapInstruction.hide();
                fitTabs(page);
                ensurePageVisibility(false);

                function allocateMarkers(mapInfo) {
                    var address = createItemAddress(dataView),
                        unresolvedAddresses = [],
                        job = mobile.nextAsycJob(),
                        marker;

                    mapInfo.fit = true;

                    if (that._mapPageWindow == null)
                        clearMarkers(mapInfo);

                    $(rows).each(function (index) {
                        var row = this.slice(0),
                            geoLocation = rowToGeoLocation(row, address),
                            titleField = allFields[fields[0].AliasIndex],
                            title = titleField.text(row[titleField.Index]);
                        if (typeof geoLocation == 'string') {
                            if (geoLocation != 'ZERO_RESULTS') {
                                unresolvedAddresses.push({ address: geoLocation, title: title, row: row });
                                if (!mapInfo.geocoder)
                                    mapInfo.geocoder = new google.maps.Geocoder();
                            }
                        }
                        else {
                            marker = createMarker(that, mapView, geoLocation, title, row);
                            if (dataView.rowIsSelected(row))
                                selectMarker(mapInfo, marker);
                        }
                    });

                    fitMarkersOnMap(mapInfo);

                    function resolveAddress() {
                        var jobChanged = job != mobile.asyncJob();
                        if (unresolvedAddresses.length && !jobChanged) {
                            var addr = unresolvedAddresses[0],
                                time = new Date();
                            mapInfo.geocoder.geocode({ address: addr.address }, function (results, status) {
                                if (status == google.maps.GeocoderStatus.OK) {
                                    var loc = results[0].geometry.location,
                                        newMarker = createMarker(that, mapView, loc, addr.title, addr.row);
                                    if (dataView.rowIsSelected(addr.row))
                                        selectMarker(mapInfo, newMarker);
                                    cacheGeoLocation(addr.address, loc.lat(), loc.lng());
                                    fitMarkersOnMap(mapInfo);
                                    animateMarker(newMarker, 750, google.maps.Animation.DROP);
                                }
                                else {
                                    if (status == google.maps.GeocoderStatus.ZERO_RESULTS)
                                        cacheGeoLocation(addr.address);
                                    else if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
                                        setTimeout(resolveAddress, 1000);
                                        return;
                                    }
                                    else
                                        alert(status + ': ' + addr.address);
                                }
                                unresolvedAddresses.splice(0, 1);
                                var elapsedTime = new Date() - time,
                                    expectedTime = 675;
                                if (elapsedTime < expectedTime)
                                    setTimeout(function () {
                                        resolveAddress();
                                    }, expectedTime - elapsedTime);
                                else
                                    resolveAddress();
                            });
                        }
                        else {
                            if (!jobChanged && unresolvedAddresses.length == 0 && mapInfo.markers.length < maxMapMarkers) {
                                var mapPageWindow = that._mapPageWindow,
                                    nextPageIndex;
                                if (!mapPageWindow)
                                    mapPageWindow = that._mapPageWindow = { top: pageIndex, bottom: pageIndex, dir: 'up' };
                                if (mapPageWindow.dir == 'up')
                                    if (mapPageWindow.bottom < that.pageCount() - 1) {
                                        mapPageWindow.bottom++;
                                        mapPageWindow.dir = 'down'
                                    }
                                    else
                                        mapPageWindow.top--;
                                else
                                    if (mapPageWindow.top > 0) {
                                        mapPageWindow.top--;
                                        mapPageWindow.dir = 'up';
                                    }
                                    else
                                        mapPageWindow.bottom++;
                                nextPageIndex = mapPageWindow.dir == 'down' ? mapPageWindow.bottom : mapPageWindow.top;
                                if (nextPageIndex >= 0 && nextPageIndex < that.pageCount() - 1) {
                                    that.pageIndex(nextPageIndex);
                                    that.refresh();
                                    return;
                                }
                            }
                            if (!jobChanged) {
                                busyIndicator(false);
                                that._mapPageWindow = null;
                            }
                        }
                    }
                    // start geocoding job
                    busyIndicator(true);
                    resolveAddress();
                }

                function refreshMapInstance() {
                    var mapInfo = mapView.data('data-map');
                    if (mapInfo) {
                        mapView.show();
                        resetMapHeight(scrollable);
                        allocateMarkers(mapInfo);
                    }
                    else
                        if (mobile.supports('Map')) {
                            mapInfo = {
                                map: new google.maps.Map(mapView.get(0), { zoom: 8 }),
                                geocoder: null,
                                markers: []
                            };
                            mapView.data('data-map', mapInfo).show();
                            that.refresh();
                        }
                        else
                            setTimeout(refreshMapInstance, 100);
                }

                if (pageInfo.requiresInitCallback) {
                    pageInfo.initCallback = function () {
                        var autoSelect = that._autoSelect;
                        that._autoSelect = null;
                        if (autoSelect && !mobile.busy())
                            that.tap(autoSelect.row, autoSelect.action);
                        else if (dataView.get_searchOnStart())
                            searchOnStart();
                        else
                            refreshMapInstance();
                    }
                    pageInfo.requiresInitCallback = false;
                    mobile.navigate(pageInfo.id);
                }
                else if (pageInfo.requiresReturnCallback) {
                    pageInfo.returnCallback = function () {
                        refreshMapInstance();
                    }
                    pageInfo.requiresReturnCallback = false;
                }
                else {
                    refreshMapInstance();
                }
                that._reset = false;
                executeRefreshCallback(pageInfo);
                return;
            }
            else {
                scrollable.find('> .app-map, > .app-map-instruction').hide();
                this._mapPageWindow = null;
            }

            if (!ie)
                scrollableCover = $('<div class="app-scrollable-cover"/>').appendTo(scrollable.parent()).css({ position: 'absolute', left: scrollable.offset().left, top: scrollable.offset().top, width: scrollable.outerWidth(), height: scrollable.outerHeight(), zIndex: 2, backgroundColor: android ? 'transparent' : '#fff' });

            if (!listview.length) {
                listview = $('<ul data-role="listview" class="app-listview"/>').appendTo(content).listview()
                    .on('taphold', function (event, originalEvent) {
                        if (originalEvent)
                            event = originalEvent;
                        if (tapIsCanceled())
                            return false;

                        if (dataView._busy()) return;
                        var target = $(event.target),
                            link = target.closest('a'),
                            dataContext = link.data('data-context'),
                            multiSelect = dataView.multiSelect() && false;

                        if (link.closest('li').is('.dv-item') && !link.is('.app-divider')) {
                            if (link.is('.app-selected')) {
                                link.removeClass('app-selected');
                                if (multiSelect) {
                                }
                                else {
                                    that.clearSelection();
                                    if (that.lookupInfo()) {
                                        callWithFeedback(link, function () {
                                            that.executeInContext('Clear');
                                        });
                                    }
                                    else {
                                        callWithFeedback(link, function () {
                                            // not implemented
                                        });
                                    }
                                }
                            }
                            else if (dataView._hasKey()) {
                                if (multiSelect) {
                                }
                                else
                                    listview.find('a.app-selected').removeClass('app-selected');
                                link.addClass('app-selected');
                                that.tap(dataContext, 'none');
                                pageInfo.echoChanged = true;
                                callWithFeedback(link, function () {
                                });
                            }
                            skipClick = true;
                        }
                        if (isGrid && !isDesktop() && target.is('span'))
                            showToolTip(target);
                        return false;
                    })
                    .on('vclick', function (event) {
                        var target = $(event.target),
                            link = target.closest('a');
                        function loadData(below) {
                            if (!dataView._busy()) {
                                that._loadAtTop = !below;
                                that.pageIndex(that.pageIndex(below ? 'bottom' : 'top') + (below ? 1 : -1));
                                that.refresh();
                            }
                        }
                        if (link.length && !link.is('.app-divider') && !isDeveloperEvent(event)) {
                            if (link.is('.dv-load-at-bottom'))
                                loadData(true);
                            else if (link.is('.dv-load-at-top:visible')) {
                                hideHeadingBar();
                                setTimeout(function () {
                                    loadData(false);
                                }, 50);
                            }
                            else {
                                if (skipClick) {
                                    skipClick = false;
                                    return;
                                }
                                if (!clickable(target) || mobile.busy())
                                    return false;
                                if (event.ctrlKey) {
                                    listview.trigger('taphold', event);
                                    skipClick = false;
                                    return false;
                                }
                                if (link.is('.dv-action-none'))
                                    return false;
                                if (dataView.multiSelect() && false) {
                                    if (listview.find('a.app-selected:first').length) {
                                        if (link.is('.app-selected'))
                                            link.removeClass('app-selected');
                                        else
                                            link.addClass('app-selected');
                                    }
                                }
                                else {
                                    callWithFeedback(target, function () {
                                        // perform tap on a regular list item
                                        if (dataView.multiSelect() && false) {
                                        }
                                        else {
                                            var dataContext = link.data('data-context')
                                            if (dataContext) {
                                                if (dataView._hasKey()) {
                                                    listview.find('a.app-selected').removeClass('app-selected');
                                                    link.addClass('app-selected');
                                                    if (target.is('.app-btn-more')) {
                                                        that.tap(dataContext, 'none');
                                                        showRowContext(target);
                                                    }
                                                    else {
                                                        that.tap(dataContext);
                                                        pageInfo.echoChanged = true;
                                                    }
                                                }
                                                else
                                                    that.tap(dataContext);
                                            }
                                            else if (link.is('.dv-action-refresh'))
                                                dataView.sync();
                                            else if (link.is('.dv-action-new'))
                                                that.executeInContext('New', null, false);
                                            else if (link.is('.dv-action-filter-clear'))
                                                clearDataFilter(dataView, true);
                                        }
                                    });
                                }
                            }
                            return false;
                        }
                    }).contextmenu(function (event) {
                        return handleFieldContextMenu(that.dataView(), event);
                    });
                addSpecialClasses(dataView, listview);
            }

            changeViewStyle(listview, viewStyle);

            if (requiresReset) {
                initialScrollTop = 0;
                clearListView(listview);
            }

            var currentItems = listview.find('li.dv-item'),
                requiresCleanup = currentItems.length > pageSize * 2,
                loadAtBottomItem = listview.find('li:last'),
                loadAtTopItem,
                topRowIndex = pageIndex * pageSize,
                loadAtTop = that._loadAtTop,
                selectedItem,
                firstVisibleItem, firstVisileItemY,
                lastVisibleItem = loadAtBottomItem && loadAtBottomItem.length && loadAtBottomItem.prev(),
                lastVisibleItemY = lastVisibleItem && lastVisibleItem.position().top,
                refreshLink,
                clearFilterLink;

            if (allowLoadAtTop && loadAtBottomItem.length == 0 || requiresCleanup && !loadAtTop && !listview.find('li.dv-load-at-top-parent').length) {
                pageHeader.hide();
                loadAtTopItem = $(String.format('<li data-icon="false" class="dv-load-at-top-parent"><a class="dv-load-at-top"><p>{0}</p></a></li>', resourcesHeaderFilter.Loading));
                if (requiresCleanup) {
                    loadAtTopItem.insertBefore(currentItems.get(0));
                    allowLoadAtTop = true;
                }
                else
                    loadAtTopItem.appendTo(listview);
            }

            if (loadAtTop) {
                loadAtTopItem = listview.find('li:first');
                firstVisibleItem = loadAtTopItem.length && loadAtTopItem.next()
                firstVisileItemY = firstVisibleItem && firstVisibleItem.position().top;
                rows = rows.slice(0).reverse();
            }
            else
                loadAtBottomItem.remove();

            //listview.detach();
            $(rows).each(function (index) {
                var row = this, v,
                    item = $('<li class="dv-item" data-icon="false"/>'),
                    rowNumber = loadAtTop ? topRowIndex + pageSize - index : topRowIndex + index + 1;
                var link = $('<a/>').appendTo(item).data('data-context', { row: this.slice(0), pageIndex: pageIndex });
                if (dataView.rowIsSelected(row)) {
                    link.addClass('app-selected');
                    if (!that.commandRow()) {
                        dataView._forgetSelectedRow(true);
                        that.command(row, 'Select');
                    }
                }
                if (isGrid)
                    createRowMarkup(dataView, row, showRowNumber ? rowNumber : null, link);
                else
                    createCardMarkup(dataView, row, itemMap, showRowNumber ? rowNumber : null, item, link);
                if (loadAtTop)
                    item.insertAfter(loadAtTopItem);
                else
                    item.appendTo(listview);
            });
            //listview.prependTo(scrollable);

            if (allowLoadAtBottom && !loadAtTop || requiresCleanup && loadAtTop && !listview.find('li.dv-load-at-bottom-parent').length)
                loadAtBottomItem = item = $(String.format('<li data-icon="false" class="dv-load-at-bottom-parent""><a href="#" class="dv-load-at-bottom"><p>{0}</p></a></li>', resourcesHeaderFilter.Loading)).appendTo(listview);
            if (loadAtTop && pageIndex == 0)
                loadAtTopItem.remove();

            if (!dataView._totalRowCount) {
                refreshLink = $('<li data-icon="refresh"><a class="dv-action-refresh"><p/></a></li>').appendTo(listview)
                    .find('a');
                refreshLink.attr('title', resourcesPager.Refresh).find('p').text(resourcesData.NoRecords);
                if (dataView._filter && dataView._filter.length && !dataView.filterIsExternal()) {
                    clearFilterLink = $('<li data-icon="filter"><a class="dv-action-filter-clear"><p/></a></li>').appendTo(listview)
                        .find('a');
                    clearFilterLink.attr('title', resourcesMobile.ClearFilter).find('p').text(resourcesMobile.ClearFilter);
                }
            }
            if (!allowLoadAtBottom) {
                var aggregates = that.aggregates(), aggregateLabels, aggregateItem, aggregateLink;
                if (aggregates && isGrid && dataView._totalRowCount > 0) {
                    aggregateItem = $('<li data-icon="false" class="dv-item"/>').appendTo(listview);
                    aggregateLink = $('<a class="app-divider app-calculated"/>').appendTo(aggregateItem);
                    createRowMarkup(dataView, aggregates, null, aggregateLink, that.aggregateLabels());

                }
                if (settings.promoteActions)
                    requiresPromoSpacing = true;
                else {
                    var contextItem = that.executeInContext('New', null, false, true),
                        newLink, newItem, prevItem, paraList;
                    if (contextItem) {
                        newItem = $('<li class="dv-action-new">').appendTo(listview).attr('data-icon', contextItem.icon);
                        newLink = $('<a class="dv-action-new"/>').appendTo(newItem).attr('title', resourcesMobile.LookupNewAction);
                        if (isGrid) {
                            $('<p>').appendTo(newLink).text(contextItem.text);
                        }
                        else {
                            $('<h3>').appendTo(newLink);
                            prevItem = newItem.prev();
                            if (prevItem.is('.dv-item')) {
                                newLink.html(prevItem.find('a').html()).find('p,img,span').css('visibility', 'hidden');
                                if (prevItem.is('.ui-li-has-thumb'))
                                    newItem.addClass('ui-li-has-thumb');
                            }
                            newLink.find('h3').text(contextItem.text);
                            if (!dataView._totalRowCount)
                                $('<p>').appendTo(newLink.html('')).text(contextItem.text);
                        }
                    }
                }
            }

            if (topRowIndex == 0) {
                pageHeaderText(true);
                var firstItem = listview.find('li:first'),
                    instruction,
                    item;
                if (!dataView._lookupInfo) {
                    parentDataView = dataView.get_parentDataView() || $app.find(dataView.get_filterSource());
                    if (parentDataView) {
                        item = createCard(parentDataView);
                        if (item) {
                            if (parentDataView.get_showInSummary())
                                page.addClass('app-has-summary');
                            item.addClass('app-yardstick');
                            addSpecialClasses(parentDataView, item);
                            item.insertBefore(firstItem);
                        }
                    }
                }
                instruction = that.instruction();
                if (instruction || isGrid) {
                    item = $('<li data-role="list-divider" class="app-list-instruction"/>').insertBefore(firstItem);
                    if (instruction)
                        item.html(instruction);
                    if (isGrid && !!dataView._totalRowCount)
                        createGridHeader(dataView, item);
                }
            }

            var stub;

            if (requiresCleanup)

                if (loadAtTop) {
                    currentItems = currentItems.slice(pageSize * (android ? 2 : 2));
                    currentItems.find('a').data('data-context', null);
                    currentItems.remove();
                    listview.find('li.dv-action-new').remove();
                }
                else {
                    pageHeader.hide();
                    stub = $(String.format('<li style="clear:left;height:{0}px"></li>', $mobile.getScreenHeight() * 10)).appendTo(listview);
                    listview.find('li.app-list-instruction').remove();
                    listview.find('li.app-li-card').remove();
                    currentItems = currentItems.slice(0, pageSize);
                    currentItems.find('a').data('data-context', null);
                    currentItems.remove();
                }

            listview.listview('refresh');
            if (requiresPromoSpacing)
                listview.find('li.dv-item:last').addClass('app-has-promo');
            yardstick(listview);

            listview.appendTo(scrollable);

            if (requiresCleanup)
                if (loadAtTop) {
                    var newFirstVisibleItemY = firstVisibleItem.position().top,
                        scrollTop = scrollable.scrollTop();
                    scrollable.scrollTop(scrollTop + newFirstVisibleItemY - firstVisileItemY);
                }
                else {
                    var newLastVisibleItemY = lastVisibleItem.position().top;
                    scrollTop = scrollable.scrollTop();
                    scrollable.scrollTop(scrollTop + newLastVisibleItemY - lastVisibleItemY);
                }
            else
                if (loadAtTop) {
                    newFirstVisibleItemY = firstVisibleItem.position().top;
                    scrollTop = scrollable.scrollTop();
                    scrollable.scrollTop(scrollTop + newFirstVisibleItemY - firstVisileItemY);
                }
                else
                    scrollable.scrollTop(initialScrollTop);
            if (stub)
                setTimeout(function () {
                    stub.prev().addClass('ui-last-child');
                    stub.remove(); // timeout solves the problem of "blinking" on an incomplete last page
                }, 100);

            selectedItem = listview.find('a.app-selected:first');

            if (isGrid) {
                if (refreshLink)
                    refreshLink.removeClass('ui-btn-icon-right').addClass('ui-btn-icon-left');
                if (newLink)
                    newLink.removeClass('ui-btn-icon-right').addClass('ui-btn-icon-left');
                if (clearFilterLink)
                    clearFilterLink.removeClass('ui-btn-icon-right').addClass('ui-btn-icon-left');
            }

            function syncView() {
                var scrollInfo,
                    loadAtTopItemHeight = 0;
                ensurePageVisibility(true);
                scrollInfo = getScrollInfo(scrollable);
                if (loadAtTopItem && loadAtTopItem.length) {
                    if (loadAtTopItem.position().top >= scrollable.scrollTop()) {
                        loadAtTopItemHeight = loadAtTopItem.outerHeight(true);
                        scrollable.scrollTop(loadAtTopItemHeight);
                    }
                }
                if (requiresReset || !that._synced) {
                    // update heading
                    if (!that._instructed && dataView._totalRowCount != -1) {
                        var instruction = that.instruction(),
                            heading = page.find('.dv-heading');
                        if (instruction || isGrid) {
                            that._instructed = true;
                            if (!heading.length)
                                heading = $('<span class="dv-heading"/>').appendTo(page).hide();
                            if (instruction)
                                heading.html(instruction.replace(/<a.*?<\/a>/gi, '')).attr('data-selector', 'ul.app-listview li.app-list-instruction');
                            if (isGrid)
                                createGridHeader(dataView, heading);
                            headingOnDemand();
                        }
                    }
                    // update page header
                    var masterDataView = dataView.get_master(),
                        masterRow,
                        identifyingField;
                    if (masterDataView)
                        if (masterDataView.get_isInserting())
                            pageHeaderText(pageInfo.text, pageHeader);
                        else {
                            row = masterDataView.extension().commandRow();
                            identifyingField = masterDataView._fields[0];
                            identifyingField = masterDataView._allFields[identifyingField.AliasIndex];
                            pageHeaderText([identifyingField.format(row[identifyingField.Index]), pageInfo.text], pageHeader);
                        }
                    if (dataView._lookupInfo)
                        pageHeaderText(pageInfo.headerText, pageHeader);
                    // scroll selected item into view
                    if (selectedItem.length) {
                        if (requiresReset)
                            dataView.raiseSelected();
                        var scrollableTop = scrollable.offset().top,
                            scrollableHeight = scrollable.height(),
                            itemTop = Math.ceil(selectedItem.offset().top),
                            itemHeight = selectedItem.outerHeight(true);

                        if (itemTop < scrollableTop || itemTop + itemHeight >= scrollableTop + scrollableHeight)
                            scrollable.scrollTop(itemTop - scrollableTop + loadAtTopItemHeight - (scrollableHeight - itemHeight) / 2);
                    }
                    else
                        if (!that._synced && dataView.get_selectedKey().length && !dataView._lookupInfo) {
                            function doSync() {
                                if (getActivePageId() == pageInfo.id && !isInTransition)
                                    dataView.sync();
                                else
                                    setTimeout(doSync, 50);
                            }
                            doSync();
                        }
                        else
                            that.clearSelection();
                    that._synced = true;
                }
                fitTabs(page);
                ensurePageVisibility(false);
                //that.stateChanged();
                busyIndicator(false);
            }
            if (pageInfo.requiresInitCallback) {
                syncView();
                pageInfo.initCallback = function () {
                    var autoSelect = that._autoSelect,
                        lookupInfo = dataView._lookupInfo;
                    that._autoSelect = null;
                    if (autoSelect && !mobile.busy())
                        that.tap(autoSelect.row, autoSelect.action);
                    else if (dataView.get_searchOnStart())
                        searchOnStart();
                    else
                        fetchOnDemand(200);
                }
                pageInfo.requiresInitCallback = false;
                mobile.navigate(pageInfo.id);
            }
            else if (pageInfo.requiresReturnCallback) {
                syncView();
                pageInfo.returnCallback = function () {
                    fetchOnDemand(200);
                }
                pageInfo.requiresReturnCallback = false;
            }
            else {
                syncView();
                fetchOnDemand(200);
            }
            if (scrollableCover)
                if (android && requiresCleanup)
                    setTimeout(function () {
                        scrollableCover.remove();
                    }, 300);
                else
                    scrollableCover.remove();

            that._reset = false;
            that._loadAtTop = null;
            executeRefreshCallback(pageInfo);
        },
        reset: function (full) {
            var dataView = this.dataView(),
                pageInfo = mobile.pageInfo(dataView._id),
                pageHash = '#' + pageInfo.id,
                history = $mobile.navigate.history,
                visible;
            this._reset = true;
            $(history.stack).each(function (index) {
                if (index > history.activeIndex)
                    return false;
                if (this.hash == pageHash) {
                    visible = true;
                    return false;
                }
            });
            if (!visible) {
                pageInfo.initialized = false;
                pageInfo.echoInitialized = false;
                pageInfo.echoId = false;
            }
        },
        visibleDataRows: function (pageIndex) {
            var dataView = this._dataView,
              currentPage = null,
              pageCount = this.pageCount(),
              cachedPages = dataView._cachedPages;
            if (cachedPages)
                for (var i = 0; i < cachedPages.length; i++) {
                    var p = cachedPages[i];
                    if (p.index == pageIndex)
                        return p.rows;
                }
            return null;
        },
        pageIndex: function (value) {
            var dataView = this._dataView;
            if (typeof value == 'string') {
                if (value == 'bottom') {
                    var bottomItemData = this.content().parent().find('ul li.dv-item:last a').data('data-context');
                    if (bottomItemData)
                        return bottomItemData.pageIndex;
                }
                if (value == 'top') {
                    var topItemData = this.content().parent().find('ul li.dv-item:first a').data('data-context');
                    if (topItemData)
                        return topItemData.pageIndex;
                }
                return dataView.get_pageIndex();
            }
            else if (value == null)
                return dataView.get_pageIndex();
            else
                dataView.set_pageIndex(value);
        },
        pageCount: function () {
            var dataView = this._dataView;
            return dataView.get_pageCount();
        },
        pageSize: function () {
            var dataView = this._dataView;
            return dataView.get_pageSize();
        },
        instruction: function (includeRowCount) {
            var lookupInfo = this.lookupInfo(),
                dataView = this.dataView(),
                instruction = this.viewDescription() || '',
                filter = this.filterStatus(),
                text;
            if (lookupInfo) {
                instruction = String.format(lookupInfo.field.ItemsDescription || resourcesMobile.LookupInstruction, lookupInfo.aliasField.HeaderText);
                if (lookupInfo.value) {
                    text = lookupInfo.text;
                    if (text && text.length > 50)
                        text = text.substring(0, 50) + '...';
                    instruction += String.format(resourcesMobile.LookupOriginalSelection, text);
                }
            }
            if (includeRowCount != false && (instruction || filter) && dataView._totalRowCount > 1) {
                if (instruction)
                    instruction += ' ';
                instruction += String.format(resourcesMobile.ShowingItemsInfo, dataView._totalRowCount);
            }

            if (filter) {
                if (instruction)
                    instruction += ' ';
                //instruction += String.format('<span class="app-filter" title="{1}">{0}</span>', filter, resourcesData.Filters.Labels.FilterToolTip);
                instruction += String.format('<span class="app-filter">{0}</span>', filter);
            }
            return instruction;
        },
        context: function (list, actionScopes) {
            var that = this,
                dataView = that.dataView(),
                extension = dataView.extension(),
                totalRowCount = dataView._totalRowCount,
                viewLabel = dataView.get_view().Label,
                sortExpression = dataView.get_sortExpression(),
                row = that.commandRow() || [],
                lookupInfo = this.lookupInfo(),
                existingRow = row && row.length;

            if (totalRowCount != -1) {
                list.push({ text: viewLabel, count: totalRowCount, theme: 'b', icon: 'dots', system: true, toolbar: false, callback: configureView });
                if (dataView.get_showQuickFind() && (totalRowCount > 1 || dataView.get_filter().length > dataView.get_externalFilter().length) || advancedSearchFilter(dataView).length)
                    list.push({
                        text: resourcesGrid.PerformAdvancedSearch, icon: 'search', toolbar: false, system: true, callback: function () {
                            startSearch(dataView);
                        }
                    });

                list.push({ text: resourcesMobile.Sort, icon: 'sort', desc: sortExpressionToText(dataView), toolbar: false, system: true, callback: configureSort });
                list.push({ text: resourcesMobile.Filter, icon: 'filter', desc: extension.filterStatus(true), toolbar: false, system: true, callback: configureFilter });

                if (!lookupInfo || lookupInfo.value != null)
                    list.push({});
                addSelectAction(dataView, list, row);
                if (lookupInfo) {
                    if ($mobile.activePage.find('.dv-heading.app-disabled').length && !contextSidebarIsVisible())
                        list.push({ text: existingRow ? that.instruction() : null });
                }
                else
                    enumerateSpecialActionContextOptions(dataView, list, row);
                if (lookupInfo) {

                    function changeLookup(value, text, row) {
                        hideHeadingBar();
                        var fieldInput = $('#' + lookupInfo.pageId + ' .app-field-' + lookupInfo.field.Name),
                            copy = lookupInfo.field.Copy,
                            copyIterator, copyInfo, copyField, copyFormat,
                            oldValue;
                        lookupInfo.value = value;
                        lookupInfo.text = text;
                        oldValue = fieldInput.val();
                        fieldInput.val(value);
                        fieldInput.prev().text(lookupInfo.text);

                        if (value && copy) {
                            copyIterator = /(\w+)\s*=\s*(\w+)/g,
                            copyInfo = copyIterator.exec(copy);
                            while (copyInfo) {
                                copyFieldInput = $('#' + lookupInfo.pageId + ' .app-field-' + copyInfo[1]);
                                copyField = dataView.findField(copyInfo[2]);
                                if (copyFieldInput.length) {
                                    if (copyField) {
                                        value = row[copyField.AliasIndex];
                                        text = copyField.text(value);
                                    }
                                    else {
                                        value = null;
                                        text = resourcesData.NullValueInForms;
                                    }
                                    if (copyFieldInput.is(':input')) {
                                        copyFieldInput.val(text);
                                        copyFormat = copyFieldInput.data('format');
                                        if (copyFormat) {
                                            copyFormat.value = value;
                                            copyFormat.text = text;
                                        }
                                        if (copyFieldInput.prev().is('.app-lookup'))
                                            copyFieldInput.prev().text(text).data('link-text', null);
                                    }
                                    else {
                                        copyFieldInput.text(text);
                                        copyInfo = lookupInfo.field._dataView.extension()._editors[copyInfo[1]];
                                        if (copyInfo) {
                                            copyInfo.value = value;
                                            copyInfo.text = text;
                                        }
                                    }
                                }
                                copyInfo = copyIterator.exec(copy);
                            }


                        }

                        transitionStatus(true);

                        function focusLookupInput() {
                            fieldInput.siblings('input:text').focus();
                        }

                        pageChangeCallback = function () {
                            if (isDesktop())
                                if (settings.pageTransition == 'none')
                                    focusLookupInput();
                                else
                                    setTimeout(focusLookupInput, 200);
                            else
                                setTimeout(function () {
                                    activeLink(fieldInput.prev());
                                }, 200);
                            if (oldValue != fieldInput.val())
                                ensureCausesCalculate(fieldInput);
                        }
                        setTimeout(function () {
                            history.go(-1);
                        }, 100);
                    }

                    if (existingRow)
                        list.push({
                            text: resourcesMobile.LookupSelectAction, icon: 'check', command: 'Select', callback: function () {
                                var dataValueField = lookupInfo.field.ItemsDataValueField,
                                    dataTextField = lookupInfo.field.ItemsDataTextField,
                                    lookupPageInfo = mobile.pageInfo(),
                                    lookupDataView = lookupPageInfo.dataView,
                                    valueField, textField;
                                if (!dataValueField)
                                    $(lookupDataView._allFields).each(function () {
                                        if (this.IsPrimaryKey) {
                                            dataValueField = this.Name;
                                            return false;
                                        }
                                    });
                                if (!dataTextField)
                                    $(lookupDataView._allFields).each(function () {
                                        var field = this;
                                        if (!field.Hidden && !field.OnDemand) {
                                            dataTextField = field.Name;
                                            return false;
                                        }
                                    });
                                valueField = lookupDataView.findField(dataValueField);
                                textField = lookupDataView.findField(dataTextField);
                                changeLookup(row[valueField.Index], row[textField.Index], row);
                            }
                        });
                    if (lookupInfo.value)
                        list.push({
                            text: resourcesMobile.UnSelect, icon: 'delete', command: 'Clear', callback: function () {
                                changeLookup(null, resourcesData.NullValueInForms);
                            }
                        });
                    if (!String.isNullOrEmpty(lookupInfo.field.ItemsNewDataView))
                        list.push({
                            text: resourcesMobile.LookupNewAction, icon: 'plus', command: 'New', callback: function () {
                                that.executeInContext('New', lookupInfo.field.ItemsNewDataView, true);
                            }
                        });
                    list.push({});
                    if (existingRow && !lookupInfo.field.tagged('lookup-details-hidden'))
                        list.push({
                            text: resourcesMobile.LookupViewAction, callback: function () {
                                Web.DataView._defaultUseCase = 'ObjectRef';
                                that.executeInContext('Select', 'editForm1', true);
                            }
                        });
                    enumerateSpecialActionContextOptions(dataView, list, row);
                }
                else {
                    if (!actionScopes)
                        actionScopes = ['Grid', 'ActionColumn', 'ActionBar'];
                    var defaultSpecialActionArgument;
                    if (actionScopes.length == 1 && actionScopes[0] == 'Grid') {
                        $(dataView._views).each(function () {
                            var view = this;
                            if (view.Type == 'Form' && view.Id.match(/edit/)) {
                                defaultSpecialActionArgument = view.Id;
                                return false;
                            }
                        });
                    }
                    enumerateActions(actionScopes, dataView, list, row, defaultSpecialActionArgument);
                }
            }
        }
    }

    /* form view */

    Web.DataView.Extensions.Form = function (dataView) {
        return new Web.DataView.MobileForm(dataView);
    }

    Web.DataView.MobileForm = function (dataView) {
        Web.DataView.MobileForm.initializeBase(this);
        this.dataView(dataView);
    }

    Web.DataView.MobileForm.prototype = {
        initialize: function () {
            this._editors = {};
            this._initRow();
        },
        _initRow: function () {
            var dataView = this.dataView(),
                row = this.inserting() ? dataView._newRow : dataView._rows[0];
            dataView._mergeRowUpdates(row);
            return this.commandRow(row);
        },
        reset: function (full) {
            this._reset = true;
            this._initRow();
        },
        options: function () {
            return { quickFind: false, filterDetails: false };
        },
        dispose: function () {
            this._dispose();
        },
        _dispose: function (forced) {
            var content = this.content();
            this._newValues = null;
            //content.find('a').data('data-context', null);
            content.find('input[data-input-type="datepicker"]').datepicker('destroy');
            content.find('select[data-role="slider"]').slider('destroy').remove();
            content.find('select').selectmenu('destroy');
            // destroy checkboxradio groups
            var fieldSets = content.find('.app-container-scrollable').data('data-field', null).find('fieldset');
            fieldSets.find(':checkbox,:input').off('click').checkboxradio('destroy'),
            fieldSets.controlgroup('destroy');
            // destroy field editors
            for (var fieldName in this._editors) {
                var f = this._editors[fieldName];
                f.field = null;
                f.originalField = null;
                $(f.item).remove();
                delete f.item;
                $(f.label).remove();
                delete f.label;
                $(f.readers).remove();
                delete f.readers;
                $(f.writers).remove();
                delete f.writers;
            }
            this._editors = {};
            content.find('div.app-status-bar, div.app-bar-buttons,div.app-stub,div.app-form-grid').remove();
            var header = content.parent().find('div[data-role="header"]');
            header.find('div[data-role="navbar"]').navbar('destroy').remove();
            header.toolbar('destroy').remove();
            disposeListViews(content);
            //content.find('ul[data-role="listview"]').listview('destroy').remove();
            var collapsible = content.find('.ui-collapsible-set');
            collapsible.find('.ui-collapsible-heading a').off();
            collapsible.remove();
            // destroy collapsible content
            //content.find('div[data-role="collapsible"]').collapsible('destroy').remove();
            //content.find('div[data-role="collapsible-set"]').collapsibleset('destroy').remove();

            // remove echos
            content.find('.app-echo').each(function () {
                var pageId = $(this).attr('data-for'),
                    pageInfo = mobile.pageInfo(pageId);
                if (pageInfo) {
                    pageInfo.echoId = null;
                    pageInfo.echoInitialized = false;
                }
            });
            content.find('.app-echo,.app-echo-toolbar').remove();
            // destroy tabs
            mobile.tabs('destroy', { container: content });
            if (forced)
                refreshContextSidebar();
        },
        viewStyle: function () {
            return 'Form';
        },
        refresh: function () {
            var that = this,
                dataView = that.dataView(),
                pageInfo = mobile.pageInfo(dataView._id),
                fields = dataView._fields,
                allFields = dataView._allFields,
                categories = dataView._categories,
                content = that.content(),
                row,
                tabs = [],
                tabsScroll = [],
                currentTab, currentGrid,
                objectIdentifier,
                context,
                map = that.itemMap(),
                statusBarDef,
                inserting = this.inserting(),
                requiresReset = this._reset,
                editors,
                showActionButtons = dataView.get_showActionButtons(),
                confirmContext = dataView._confirmContext,
                page = $('#' + pageInfo.id),
                pageHeader = page.find('.app-page-header'),
                stub;

            function showHideBottomButtonBar(show) {
                bar = content.find('.app-bar-buttons:eq(1)');
                if (show)
                    bar.removeClass('app-bar-buttons-hidden'); //.css('display', '');
                else
                    if (content.find('.ui-collapsible:visible .ui-collapsible-heading:not(.ui-collapsible-heading-collapsed)').length)
                        bar.removeClass('app-bar-buttons-hidden');
                    else
                        bar.addClass('app-bar-buttons-hidden'); //.hide();
            }

            function categoryState(catIndex, collapse) {
                if (arguments.length == 2)
                    dataView.viewProp('categoryState' + catIndex, collapse);
                else
                    return dataView.viewProp('categoryState' + catIndex) == true;
            }

            pageInfo.headerText = confirmContext && confirmContext.WindowTitle || dataView.get_view().Label;
            if (inserting)
                pageHeader.attr('data-locked', 'false').data('data-text', null);
            pageHeaderText(pageInfo.headerText, pageHeader);
            content.closest('.ui-page').addClass('app-form-page');

            if (requiresReset) {
                that._dispose();
                that._commandRow = null;
            }
            editors = that._editors;
            row = that.commandRow() || that._initRow() || [];

            statusBarDef = dataView.statusBar();
            if (statusBarDef) {
                var statusBar = $('<div class="app-status-bar"/>').html(statusBarDef).appendTo(content),
                    currentStatus = statusBar.find('.Current'),
                    statusWidth, statusLeft, clientWidth;
                if (!isDesktopClient)
                    statusBar.css('overflow-x', 'auto');
            }

            var parentDataView = $app.find(dataView.get_filterSource()),
                cardList, cardItem;
            if (parentDataView) {
                cardItem = createCard(parentDataView);
                if (cardItem) {
                    cardItem = cardItem.appendTo(content);
                    if (parentDataView.get_showInSummary())
                        page.addClass('app-has-summary');
                    cardList = $('<ul data-role="listview" class="app-listview"/>').appendTo(content);
                    addSpecialClasses(parentDataView, cardList);
                    cardItem.appendTo(cardList);
                    yardstick(cardList.listview());
                }
            }

            var instruction = that.viewDescription();
            if (instruction) {
                var descList = $('<ul data-role="listview" class="app-list-instruction"/>').appendTo(content);
                $('<li data-role="list-divider" class="app-list-instruction"/>').appendTo(descList).html(instruction);
                descList.listview();
            }

            if (showActionButtons == 'TopAndBottom' || showActionButtons == 'Top')
                $('<div class="app-bar-buttons"/>').appendTo(content);

            if (!inserting) {
                objectIdentifier = allFields[allFields[map.heading].AliasIndex];
                objectIdentifier = objectIdentifier.text(row[objectIdentifier.Index], false);
            }

            var maxColumnCount = 4,
                firstColumn = true,
                categoryColumnCount = 0,
                categoryColumnIndex = 0,
                columnGrid, columnGridBlock,
                tabColumns = [], tabCount = 0, tabIndex = 0;

            $(categories).each(function (index) {
                var category = this;
                if (currentTab != category.Tab) {
                    currentTab = category.Tab;
                    categoryColumnCount = 0;
                    categoryColumnIndex = 0;
                    firstCategory = true;
                    tabCount++;
                }
                if (firstCategory || category.NewColumn)
                    categoryColumnCount++;
                if (currentTab)
                    tabColumns[tabCount - 1] = categoryColumnCount;
                firstCategory = false;
            })

            if (tabColumns.length)
                $(tabColumns).each(function (index) {
                    var columnCount = this;
                    if (columnCount > maxColumnCount)
                        columnCount = maxColumnCount;
                    tabColumns[index] = columnCount == 1 ? null : $('<div></div>').appendTo(content).addClass('app-form-grid ui-grid-' + String.fromCharCode(97 + columnCount - 2));
                })
            else
                if (categoryColumnCount > 1) {
                    if (categoryColumnCount > maxColumnCount)
                        categoryColumnCount = maxColumnCount;
                    columnGrid = $('<div></div>').appendTo(content).addClass('app-form-grid ui-grid-' + String.fromCharCode(97 + categoryColumnCount - 2));
                }

            function revealObjectIdentifier() {
                // this is redundant since the identifier is already displayed in the page header
                //if (!that.inserting())
                //    content.find('.ui-collapsible-heading-collapsed .dv-object-identifier').show().closest('.ui-collapsible').find('.dv-heading').addClass('app-disabled');
            }

            currentTab = null;
            currentGrid = columnGrid;

            $(categories).each(function (catIndex) {
                var category = this;

                if (!currentTab || currentTab.text != category.Tab) {
                    currentTab = { text: category.Tab, content: [] };
                    if (tabColumns.length)
                        currentGrid = tabColumns[tabIndex++];
                    categoryColumnIndex = 0;
                    columnGridBlock = null;
                    tabs.push(currentTab);
                }

                if (currentGrid) {
                    if (!currentTab.content.length)
                        currentTab.content.push(currentGrid);
                    if ((categoryColumnIndex == 0 || this.NewColumn) && categoryColumnIndex < maxColumnCount)
                        columnGridBlock = $('<div>').appendTo(currentGrid).addClass('ui-block-' + String.fromCharCode(97 + categoryColumnIndex++));
                }


                var collapsibleSet = $('<div class="ui-collapsible-set ui-group-theme-inherit"></div>').appendTo(columnGridBlock || content),
                    collapsible = $('<div class="ui-collapsible ui-collapsible-themed-content ui-first-child ui-last-child"></div>').appendTo(collapsibleSet.addClass('app-category-' + category.Id)),
                    description = dataView._processTemplatedText(row, category.Description),
                    descriptionText = dataView._formatViewText(resourcesViews.DefaultCategoryDescriptions[description], true, description),
                    listview,
                    hasObjectIdentifier,
                    collapsibleHeading = $('<h3 class="ui-collapsible-heading"/>').appendTo(collapsible), // ui-btn-icon-right app-btn-icon-transparent  ui-icon-carat-u
                    headingButton = $('<a class="ui-collapsible-heading-toggle ui-btn ui-btn-a"/>').appendTo(collapsibleHeading).text(category.HeaderText),
                    collapsibleContent = $('<div class="ui-collapsible-content ui-body-a" aria-hidden="false"></div>').appendTo(collapsible);

                $(iconCaratU).appendTo(headingButton);
                $(iconCaratD).appendTo(headingButton);

                if (!currentGrid)
                    currentTab.content.push(collapsibleSet);

                listview = $('<ul data-role="listview" data-theme="a" data-inset="false" class="app-formview"/>').appendTo(collapsibleContent);
                if (!String.isNullOrEmpty(descriptionText))
                    $('<li data-role="list-divider" class="app-list-instruction"/>').appendTo(listview).html(descriptionText.replace(/\n/g, '<p/>'));
                $(fields).each(function () {
                    var field = this,
                        originalField = field,
                        v, t,
                        headerData;
                    if (field.CategoryIndex == category.Index) {
                        field = allFields[field.AliasIndex];
                        v = row[originalField.Index];
                        t = field.text(row[field.Index], false);
                        if (!inserting && !hasObjectIdentifier) {
                            hasObjectIdentifier = true;
                            headerData = pageHeaderText(null, pageHeader);
                            $('<span class="dv-object-identifier"/>').text(objectIdentifier).appendTo(headingButton).hide();
                            if (typeof headerData == 'string')
                                headerData = [0, headerData];
                            headerData[0] = objectIdentifier;
                            pageHeaderText(headerData, pageHeader);
                            pageHeader.attr('data-locked', 'true')
                        }
                        var item = $('<li class="ui-field-contain"/>').appendTo(listview),
                            fieldLabel = $('<label class="app-static-label"/>').appendTo(item).text(field.HeaderText);
                        if (!field.AllowNulls)
                            fieldLabel.addClass('app-required');
                        editors[originalField.Name] = {
                            field: field, originalField: originalField, item: item, label: fieldLabel,
                            value: v,
                            originalValue: row[originalField.Index],
                            text: t, trimmedText: field.trim(t),
                            readers: [], writers: []
                        };
                    }
                });
                collapsibleSet.find('ul').listview();

                headingButton.on('vclick', function (event, feedback) {
                    var link = $(this),
                        doExpand = collapsibleHeading.is('.ui-collapsible-heading-collapsed');
                    function expandCollapse() {
                        collapsibleHeading.toggleClass('ui-collapsible-heading-collapsed');
                        //link.toggleClass('ui-icon-carat-u ui-icon-carat-d');
                        if (doExpand) {
                            collapsibleContent.show();
                            link.find('.dv-object-identifier').hide().closest('.ui-collapsible').find('.dv-heading').removeClass('app-disabled');
                            showHideBottomButtonBar(true);
                            blurFocusedInput();
                            if (!that.inserting())
                                categoryState(catIndex, false);
                            fetchEchos();
                        }
                        else {
                            collapsibleContent.hide();
                            if (!that.inserting())
                                categoryState(catIndex, true);
                            showHideBottomButtonBar();
                            revealObjectIdentifier();
                            blurFocusedInput();
                            fetchEchos();
                        }
                    }
                    if (feedback == false)
                        expandCollapse();
                    else
                        callWithFeedback(link, expandCollapse);
                });
                if (category.Collapsed || categoryState(catIndex)) {
                    collapsibleHeading.addClass('ui-collapsible-heading-collapsed');
                    collapsibleContent.hide();
                }
                if (!category.HeaderText)
                    collapsibleHeading.hide().closest('.ui-collapsible').addClass('app-divider');
            });

            mobile.tabs('create', {
                id: dataView._id + '_tabset', tabs: tabs, className: 'app-tabs-form',
                change: function (tab) {
                    blurFocusedInput();
                    adjustScrollableContainers(content);
                    $(tab.content).each(function () {
                        this.find('textarea').textinput('refresh');
                    });
                    showHideBottomButtonBar();
                }
            });

            $(tabColumns).each(function (index) {
                var grid = tabColumns[index];
                if (grid)
                    grid.appendTo(content);
            });

            if (showActionButtons == 'TopAndBottom' || showActionButtons == 'Bottom')
                $('<div class="app-bar-buttons"/>').appendTo(content);

            context = [];
            that.context(context);
            if (showActionButtons != 'None')
                mobile.refreshAppButtons(context, { buttonBars: content.find('.app-bar-buttons'), toolbar: false });


            // render context links for child views
            taskAssistant(dataView, content);

            stub = $('<div class="app-stub"/>').appendTo(content);
            if (content.find('.app-echo').length)
                stub.height($mobile.getScreenHeight() * .6);
            that.stateChanged();


            // refresh app buttons
            that._reset = false;


            function syncView() {
                if (statusBarDef && currentStatus.length) {
                    statusWidth = currentStatus.outerWidth();
                    statusLeft = currentStatus.offset().left;
                    clientWidth = $window.width();
                    if (contextSidebarIsVisible())
                        clientWidth -= $('#app-sidebar').outerWidth();
                    if (statusLeft + statusWidth + 20 > clientWidth)
                        statusBar.scrollLeft(currentStatus.is('.Last') ?
                            (statusLeft + statusWidth - clientWidth) + (currentStatus.outerWidth(true) - currentStatus.find('.Self').outerWidth()) :
                            (statusLeft - (clientWidth - statusWidth) / 2));
                }
                fetchOnDemand(200);
                setTimeout(function () {
                    focusFormInput(content);
                }, 100);
            }

            if (pageInfo.requiresInitCallback) {
                var pageIsInvisible = page.css('display') != 'block';
                if (pageIsInvisible)
                    page.css({ 'display': 'block', 'z-index': -10 });
                revealObjectIdentifier();
                showHideBottomButtonBar();
                adjustScrollableContainers(content);
                //if (tabs.length)
                //    resetPageHeight(page);
                if (showActionButtons != 'None')
                    mobile.refreshAppButtons(context, { buttonBars: content.find('.app-bar-buttons'), toolbar: false });
                fitTabs(page);
                if (pageIsInvisible)
                    page.css({ 'display': '', 'z-index': '' });


                pageInfo.requiresInitCallback = false;
                isInTransition = false;
                pageInfo.initCallback = syncView;
                mobile.navigate(pageInfo.id);
                //setTimeout(function () {
                //    mobile.changePage(pageInfo.id);
                //}, 300);
            }
            else
                syncView();
            executeRefreshCallback(pageInfo);
        },
        collect: function () {
            var that = this,
                values = [], v,
                dataView = that.dataView(),
                allFields = dataView._allFields,
                originalRow = this.commandRow(),
                inserting = that.inserting(),
                originalValue,
                fieldInfo,
                newValues;
            if (!originalRow)
                return values;
            $(allFields).each(function () {
                var field = this,
                    fieldInput = $mobile.activePage.find('*.app-field-' + field.Name + ':input'),
                    fieldInfo;
                if (field.OnDemand) return;
                originalValue = originalRow[field.Index];
                v = { Name: field.Name, OldValue: inserting ? null : originalValue, NewValue: originalValue, Modified: inserting && originalValue != null };
                v.ReadOnly = field.ReadOnly && !(field.IsPrimaryKey && inserting);
                if (fieldInput.length) {
                    v.NewValue = fieldInput.is('select') ? fieldInput.find('option:selected').data('value') : fieldInput.val().trim();
                    if (!(ie || isDesktop()))
                        if (field.Type.match(/^Date/)) {
                            if (field.TimeFmtStr)
                                v.NewValue = htmlStringToDateTime(v.NewValue);
                            else
                                v.NewValue = htmlStringToDate(v.NewValue);
                        }
                    v.Modified = true;
                }
                else {
                    fieldInfo = that._editors[field.Name];
                    if (fieldInfo) {
                        v.NewValue = fieldInfo.value;
                        v.Modified = true;
                    }
                    else {
                        newValues = that._newValues;
                        if (newValues && field.Name in newValues) {
                            v.NewValue = newValues[field.Name];
                            v.Modified = true;

                        }
                    }
                }
                values.push(v);
            });
            return values;
        },
        _readWrite: function () {
            var that = this,
                dataView = that.dataView(),
                viewId = dataView._id,
                editing = that.editing(),
                inserting = that.inserting(),
                editors = that._editors,
                fieldName, v, t,
                fieldInfo, field, originalField, aliasField, fieldLabel, item,
                map = that.itemMap(), itemsStyle,
                fieldInput, inputId, inputContainer, fieldContainer,
                fieldClass,
                content = that.content(),
                listview = content.find('.ui-collapsible ul'),
                fieldLink,
                requiresDatePicker,
                legacyCalculatedFields = {},
                causesCalculate;

            function showHide(elements, show) {
                $(elements).each(function () {
                    if (show) {
                        if (fieldInfo.item.children().length == 1)
                            this.appendTo(fieldInfo.item);
                    }
                    else
                        this.detach();
                });
            }

            function initFieldInput() {
                inputId = viewId + '_' + field.Name + '_Input';
                fieldLabel.attr('for', inputId);
                fieldInput.appendTo(item).attr('id', inputId).addClass(fieldClass);
                if (field.Len)
                    fieldInput.attr('maxlength', field.Len);
                if (field.Watermark)
                    fieldInput.attr('placeholder', field.Watermark);
                if (causesCalculate)
                    fieldInput.attr('data-causes-calculate', causesCalculate);
            }

            //if (editing)
            //    listview.addClass('app-editing');
            //else
            //    listview.removeClass('app-editing');

            if (editing)
                listview.addClass('app-form-editing');
            else
                listview.removeClass('app-form-editing');

            $(dataView._allFields).each(function () {
                var field = this,
                    triggerField;
                if (field.Calculated && field.ContextFields) {
                    $(field.ContextFields.split(/\s*,\s*/)).each(function () {
                        if (dataView.findField(this))
                            legacyCalculatedFields[this] = true;
                    });
                }
            });

            for (fieldName in editors) {
                fieldInfo = editors[fieldName];
                field = fieldInfo.field;
                originalField = fieldInfo.originalField,
                fieldLabel = fieldInfo.label;
                item = fieldInfo.item;
                v = fieldInfo.value;
                t = fieldInfo.text;
                if (!editing)
                    t = fieldInfo.trimmedText;
                fieldClass = 'app-field-' + field.Name;
                itemsStyle = originalField.ItemsStyle;
                causesCalculate = originalField.CausesCalculate || legacyCalculatedFields[originalField.Name] ? originalField.Name + '.' + dataView._id + '.app' : null;

                if (editing && !originalField.isReadOnly() && !field.OnDemand) {
                    showHide(fieldInfo.readers, false);
                    if (fieldInfo.writers.length) {
                        showHide(fieldInfo.writers, true);
                    }
                    else {
                        if (!String.isNullOrEmpty(itemsStyle)) {
                            aliasField = field;
                            field = originalField;
                            fieldClass = 'app-field-' + field.Name;
                            v = fieldInfo.originalValue;
                            if (itemsStyle == 'Lookup' || itemsStyle == 'AutoComplete') {
                                fieldInput = $('<input type="hidden"/>').val(v);
                                initFieldInput();
                                inputContainer = $('<div>').appendTo(item);
                                fieldInput.appendTo(inputContainer);
                                var dummy = $('<input type="text" class="app-lookup-input"/>').insertBefore(fieldInput).attr('id', inputId),
                                    link = $('<a href="#app-lookup" class="ui-btn ui-icon-carat-r ui-btn-icon-right ui-corner-all app-lookup"/>').insertBefore(fieldInput)
                                    .text(t).data('data-context', { field: originalField, aliasField: aliasField, value: v, text: t, pageId: viewId });
                                if (isDesktopClient)
                                    link.attr('tabindex', -1);
                            }
                            else if (itemsStyle == 'CheckBox') {
                                fieldInput = $('<select data-role="slider">');
                                var maxTextLength = 0;
                                $(originalField.Items).each(function () {
                                    var value = this[0],
                                        text = this[1],
                                        option = $('<option>').attr('value', value != null ? value.toString() : '').data('value', value).text(text).appendTo(fieldInput);
                                    if (text.length > maxTextLength)
                                        maxTextLength = text.length;
                                });
                                initFieldInput();
                                fieldInput.val(v != null ? v.toString() : '');
                                inputContainer = fieldInput.slider();
                                fieldInput.next().css('width', maxTextLength + 2 + 'em');
                            }
                            else if (itemsStyle == 'CheckBoxList' || itemsStyle == 'RadioButtonList' || itemsStyle == 'ListBox') {
                                fieldInput = $('<input type="hidden"/>');
                                initFieldInput();
                                fieldInput.val(v != null ? v.toString() : '').attr('data-field', field.Name);
                                var multipleChoices = itemsStyle == 'CheckBoxList',
                                    fieldSetContainer,
                                    fieldSet,
                                    fieldSetList = [],
                                    selectedValues = v != null ? v.toString().split(/\s*,\s*/) : [],
                                    itemsPerColumn = Math.min(Math.ceil(field.Items.length / (field.Columns > 1 ? field.Columns : 1)), Math.max(Math.ceil(mobile.screen().height * .45 / checkBoxRadioHeight()), 3));

                                fieldSetContainer = $('<div class="app-container-scrollable"/>').attr('data-columns', field.Columns);

                                $(field.Items).each(function (index) {
                                    if (index % itemsPerColumn == 0) {
                                        fieldSet = $('<fieldset class="app-controlgroup-vertical"/>').appendTo(fieldSetContainer);
                                        fieldSetList.push(fieldSet);
                                    }
                                    var option = this,
                                        optionInput = $('<input/>').attr({ 'id': inputId + index, 'type': multipleChoices ? 'checkbox' : 'radio' }).appendTo(fieldSet),
                                        optionLabel = $('<label/>').attr('for', inputId + index).appendTo(fieldSet).text(option[1]);
                                    if (!multipleChoices)
                                        optionInput.attr('name', inputId);
                                    if (!field.HtmlEncode)
                                        optionLabel.html(option[1]);
                                    if (multipleChoices && selectedValues.indexOf(option[0]) != -1 || !multipleChoices && option[0] == v)
                                        optionInput.attr('checked', 'true');
                                });
                                fieldSetContainer.insertBefore(fieldInput).data('data-field', field);
                                $(fieldSetList).controlgroup().find(':checkbox,:radio').checkboxradio();
                                fieldSetContainer.find(':checkbox,:radio').on('click', handleTriggeredCheckboxRadioClicks);
                                inputContainer = fieldInput;
                            }
                            else {
                                fieldInput = $('<select>').addClass('app-lookup');
                                $(originalField.Items).each(function () {
                                    var value = this[0],
                                        text = this[1],
                                        option = $('<option>').attr('value', value != null ? value.toString() : '').data('value', value).text(text).appendTo(fieldInput);
                                });
                                initFieldInput();
                                fieldInput.val(v != null ? v.toString() : '');
                                inputContainer = fieldInput.selectmenu();
                            }
                        }
                        else {
                            requiresDatePicker = false;
                            var isTextArea = field.Rows > 1;
                            fieldInput = isTextArea ? $('<textarea/>') : $('<input type="text" />');
                            if (isTextArea) {
                                fieldInput.attr('rows', field.Rows);
                                if (isDesktopClient || (!iOS || true))
                                    fieldInput.attr('data-autogrow', 'false');
                                if (ie)
                                    fieldInput.css('white-space', 'pre-wrap');
                            }
                            else if (field.TextMode == 1)
                                fieldInput.attr('type', 'password');
                            else if (field.Type == 'String') {
                                if (isPhoneField(field))
                                    fieldInput.attr('type', 'tel');
                                else if (isEmailField(field))
                                    fieldInput.attr('type', 'email');
                                else if (isUrlField(field))
                                    fieldInput.attr('type', 'url');
                            }
                            else
                                if (field.Type.match(/^Date/)) {
                                    fieldInput.addClass('app-input-date');
                                    if (ie || isDesktop())
                                        requiresDatePicker = true;
                                    else {
                                        if (!field.TimeFmtStr) {
                                            fieldInput.attr('type', 'date');
                                            t = dateToHtmlString(v);
                                        }
                                        else {
                                            fieldInput.attr('type', 'datetime-local');
                                            t = dateTimeToHtmlString(v);
                                        }
                                    }
                                }
                                else if (field.Type != 'TimeSpan')
                                    fieldInput.data('format', { type: 'number', value: v, text: v == null ? '' : t, field: field });
                            initFieldInput();
                            fieldInput.val(v == null ? '' : t);
                            inputContainer = fieldInput.textinput({ clearBtn: !isTextArea, clearBtnText: resourcesMobile.ClearText });
                            if (isTextArea)
                                inputContainer.textinput('refresh');
                            else {
                                if (isDesktopClient)
                                    inputContainer.parent().find('.ui-input-clear').attr('tabindex', -1);
                            }
                            if (requiresDatePicker) {
                                $(fieldInput).attr({ 'data-input-type': 'datepicker', 'data-format-string': field.DataFormatString }).datepicker();
                            }
                        }
                        fieldInfo.item.children().each(function (index) {
                            if (index > 0)
                                fieldInfo.writers.push($(this));
                        });
                    }
                }
                else {
                    fieldLabel.attr('for', '');
                    showHide(fieldInfo.writers, false);
                    if (fieldInfo.readers.length) {
                        showHide(fieldInfo.readers, true);
                    }
                    else {
                        inputContainer = $('<div class="ui-input-text ui-body-inherit ui-corner-all app-static-text"/>').appendTo(item);
                        fieldText = $('<div>').appendTo(inputContainer).addClass(fieldClass);
                        fieldInfo.readers.push(inputContainer);
                        if (field.Index == map.heading)
                            item.addClass('dv-heading');
                        if (field.OnDemand) {
                            if (!v || v.match(/^null/))
                                fieldText.text(resourcesData.NullValueInForms);
                            else {
                                var blobHref = dataView.resolveClientUrl(dataView.get_appRootPath()),
                                    blobLink = $('<a rel="external"/>').appendTo(fieldText).attr('href', String.format('{0}blob.ashx?{1}=o|{2}', blobHref, field.OnDemandHandler, t));
                                if (field.OnDemandStyle == 0) {
                                    $('<img class="app-image-thumb">').appendTo(blobLink).attr('src', String.format('{0}blob.ashx?{1}=t|{2}&_nocrop', blobHref, field.OnDemandHandler, t))
                                    blobLink.attr('data-content-type', 'image');
                                }
                                else {
                                    blobLink.text(resourcesData.BlobDownloadLink).addClass('ui-btn ui-btn-icon-left ui-icon-arrow-d ui-btn-inline ui-mini ui-shadow ui-corner-all').appendTo(fieldText.parent());
                                    if (isDesktop())
                                        blobLink.attr('target', '_blank');
                                    fieldText.remove();
                                }
                            }
                        }
                        else {
                            if (field.htmlEncode())
                                fieldText.html(t);
                            else
                                fieldText.text(t);
                            fieldLink = null;
                            if (isPhoneField(field, true) && v)
                                fieldLink = $('<a class="ui-btn-right ui-btn ui-icon-phone ui-btn-icon-notext ui-shadow ui-corner-all app-btn" rel="external"/>').appendTo(fieldText).attr('href', 'tel:' + v);
                            else if (isEmailField(field, true) && v)
                                fieldLink = $('<a class="ui-btn-right ui-btn ui-icon-mail ui-btn-icon-notext ui-shadow ui-corner-all app-btn" rel="external"/>').appendTo(fieldText).attr('href', 'mailto:' + v);
                            else if (isUrlField(field, true) && v)
                                fieldLink = $('<a class="ui-btn-right ui-btn ui-icon-eye ui-btn-icon-notext ui-shadow ui-corner-all app-btn" rel="external"/>').appendTo(fieldText).attr({ 'href': v });
                            else if (isLocationField(field, true) && v)
                                fieldLink = $('<a class="ui-btn-right ui-btn ui-icon-location ui-btn-icon-notext ui-shadow ui-corner-all app-btn" rel="external"/>').appendTo(fieldText).attr({ 'href': rowToAddressUrl(that.commandRow(), createItemAddress(dataView), 'q') });
                            else if (isLookupField(originalField) && originalField.ItemsDataController && v && !originalField.tagged('lookup-details-hidden'))
                                fieldLink = $('<a href="#app-details" class="ui-btn-right ui-btn ui-icon-carat-r ui-btn-icon-notext ui-shadow ui-corner-all app-btn"/>').appendTo(fieldText)
                                    .attr('data-field-name', originalField.Name).attr('data-field-text', field.HeaderText + ' - ' + dataView.get_view().Label);
                            if (fieldLink)
                                fieldLink.attr('title', field.HeaderText + ':\n' + v);
                        }
                    }
                    showHide(fieldInfo.writers, false);
                }
            }
        },
        stateChanged: function () {
            var that = this,
                dataView = that.dataView(),
                content = that.content(),
                editing = that.editing(),
                collapsibleHeadings;
            that._readWrite();
            that.calculate(dataView);
            if (editing) {
                collapsibleHeadings = content.find('.ui-collapsible:visible .ui-collapsible-heading');
                if (!collapsibleHeadings.filter(':not(.ui-collapsible-heading-collapsed)').length)
                    collapsibleHeadings.first().find('.ui-btn').trigger('vclick', false);
                focusFormInput(content);
            }
            if (content.closest('.ui-page:visible').length)
                adjustScrollableContainers(content);
            refreshContextSidebar();
        },
        context: function (list) {
            var that = this,
                dataView = that.dataView(),
                row = that.commandRow(),
                editing = that.editing();
            addSelectAction(dataView, list, row);
            if (!editing)
                enumerateSpecialActionContextOptions(dataView, list, row);
            //if (editing)
            //    list.push({ text: resourcesForm.RequiredFiledMarkerFootnote });
            enumerateActions(['Form', 'ActionBar'], dataView, list, row);
        },
        calculate: function (causedBy) {
            var that = this,
                dataView,
                field;
            if (typeof causedBy == 'string') {
                // raise server-side "Calculate" event
                dataView = mobile.dataView();
                field = dataView.findField(causedBy);
                if (field)
                    dataView._raiseCalculate(field, field);
            }
            else {
                dataView = causedBy;
                var page = mobile.page(dataView._id),
                    row,
                    readWriteRequired;

                function ensureRow() {
                    if (!row) {
                        row = [],
                        $(dataView._collectFieldValues()).each(function () {
                            var fv = this,
                                field = dataView.findField(fv.Name);
                            row[field.Index] = fv.Modified ? fv.NewValue : fv.OldValue;
                        });
                    }
                }

                // change visibility of data fields
                $(dataView._expressions).each(function () {
                    var expression = this,
                        result,
                        input,
                        li,
                        listItems;
                    if (expression.Scope == 3) {
                        ensureRow();
                        result = dataView._evaluateJavaScriptExpressions([expression], row, false);
                        input = page.find('.app-field-' + expression.Target);
                        if (input.length) {
                            li = input.closest('.ui-field-contain');
                            if (result)
                                li.show();
                            else
                                li.hide();
                            listItems = li.closest('ul').find('> li').removeClass('ui-first-child ui-last-child').filter(':visible');
                            if (listItems.length) {
                                $(listItems[0]).addClass('ui-first-child');
                                $(listItems[listItems.length - 1]).addClass('ui-last-child');
                            }

                        }
                    }
                });

                // change visibility of categories 
                $(dataView._expressions).each(function () {
                    var expression = this,
                        result,
                        category,
                        block;
                    if (expression.Scope == 2) {
                        ensureRow();
                        result = dataView._evaluateJavaScriptExpressions([expression], row, false);
                        category = page.find('.app-category-' + expression.Target);
                        if (category.length) {
                            if (result)
                                category.show().removeClass('app-hidden');
                            else
                                category.hide().addClass('app-hidden');
                            if (category.closest('.app-form-grid').length) {
                                block = category.parent();
                                if (block.find('> .ui-collapsible-set:not(.app-hidden)').length)
                                    block.show().removeClass('app-hidden');
                                else
                                    block.hide().addClass('app-hidden');
                            }
                        }
                    }
                });

                // update responsive column grids in the form
                page.find('.app-form-grid').each(function () {
                    var grid = $(this),
                        visibleBlocks = grid.find('> div:not(.app-hidden)'),
                        className = grid.attr('class').replace(/ui-grid-\w+/, '').trim();
                    if (visibleBlocks.length == 0)
                        grid.hide();
                    else {
                        className += ' ui-grid-' + (visibleBlocks.length == 1 ? 'solo' : String.fromCharCode(97 + visibleBlocks.length - 2))
                        if (grid.attr('class') != className)
                            grid.attr('class', className);
                        grid.css('display', '');
                        visibleBlocks.each(function (index) {
                            var block = $(this),
                                className = 'ui-block-' + String.fromCharCode(97 + index);
                            if (block.attr('class') != className)
                                $(this).attr('class', className);
                        });
                    }
                });

                // refresh visibility of tabs
                // TO-DO

                // change read-only state of fields
                $(dataView._expressions).each(function () {
                    var expression = this,
                        result,
                        field;
                    if (expression.Scope == 5) {
                        field = dataView.findField(expression.Target);
                        if (field) {
                            if (field._originalTextMode == null)
                                field._originalTextMode = field.TextMode;
                            ensureRow();
                            result = dataView._evaluateJavaScriptExpressions([expression], row, false);
                            if (field.isReadOnly() != result) {
                                field.TextMode = result ? 4 : field._originalTextMode;
                                readWriteRequired = true;
                            }
                        }
                    }
                });
                if (readWriteRequired)
                    that._readWrite();
                that._refreshButtons();
            }
        },
        afterCalculate: function (values) {
            var that = this,
                dataView = that.dataView(),
                page = $('#' + dataView._id);
            mobile.causesCalculate(false);
            $(values).each(function () {
                var fv = this,
                    fieldInfo = that._editors[fv.Name],
                    v, t,
                    field, dataFormat, originalField,
                    itemsStyle,
                    fieldInput,
                    elem, data;
                if (fieldInfo) {
                    field = fieldInfo.originalField;
                    itemsStyle = field.ItemsStyle;
                    v = fieldInfo.value = fv.NewValue;
                    if (fv.NewValue == null) {
                        t = fieldInfo.text = resourcesData.NullValueInForms;
                        fieldInfo.trimmedText = fieldInfo.text;
                    }
                    else {
                        t = fieldInfo.text = field.format(fv.NewValue, false);
                        fieldInfo.trimmedText = field.trim(fieldInfo.text);
                    }
                    fieldInput = page.find('.app-field-' + field.Name);
                    if (fieldInput.length) {
                        // read-only text
                        if (fieldInput.is('div')) {
                            if (field.htmlEncode())
                                fieldInput.text(fieldInfo.trimmedText);
                            else
                                fieldInput.html(fieldInfo.trimmedText);

                        }
                        else if (itemsStyle == 'Lookup' || itemsStyle == 'AutoComplete') {
                            fieldInput.val(v != null ? v.toString() : '').prev().data('data-context').value = v;
                        }
                        else if (itemsStyle == 'CheckBox') {
                            fieldInput.val(v != null ? v.toString() : '');
                            fieldInput.slider('refresh');
                        }
                        else if (itemsStyle == 'CheckBoxList' || itemsStyle == 'RadioButtonList' || itemsStyle == 'ListBox') {
                            $(field.Items).each(function (index) {
                                if (this[0] == v) {
                                    var container = fieldInput.prev();
                                    container.find(':input:eq(' + index + ')').trigger('click');
                                    container.find(':checkbox,:radio').checkboxradio('refresh');
                                    return false;
                                }
                            });
                        }
                        else if (itemsStyle) {
                            fieldInput.next().val(v != null ? v.toString() : '');
                            fieldInput.next().selectmenu('refresh');
                        }
                        else {
                            // text input or textarea
                            dataFormat = fieldInput.data('format');
                            if (dataFormat) {
                                dataFormat.value = v;
                                dataFormat.text = v == null ? '' : t;
                            }
                            if (field.Type.match(/^Date/)) {
                                if (!(ie || isDesktop())) {
                                    if (!field.TimeFmtStr)
                                        t = dateToHtmlString(v);
                                    else
                                        t = dateTimeToHtmlString(v);
                                }
                            }
                            if (fieldInput.is(':focus') && dataFormat)
                                fieldInput.val(v == null ? '' : v);
                            else
                                fieldInput.val(v == null ? '' : t);
                        }
                    }
                }
                else {
                    // update hidden field
                    if (!that._newValues)
                        that._newValues = {};
                    that._newValues[fv.Name] = fv.NewValue;
                    field = dataView.findField(fv.Name);
                    if (field) {
                        originalField = dataView.findFieldUnderAlias(field);
                        if (originalField != field) {
                            fieldInput = page.find('.app-field-' + originalField.Name);
                            if (fieldInput.length) {
                                elem = fieldInput.prev();
                                if (fv.NewValue == null)
                                    t = resourcesData.NullValueInForms;
                                else
                                    t = field.format(fv.NewValue, false);
                                data = elem.text(t).data('data-context');
                                if (data)
                                    data.text = t;
                            }
                        }
                    }
                }

            });
            that._refreshButtons();
        },
        _refreshButtons: function () {
            var doRefresh;
            $(this.dataView()._actionGroups).each(function () {
                $(this.Actions).each(function () {
                    if (this._whenClientScript) {
                        doRefresh = true;
                        return false;
                    }
                });
                if (doRefresh)
                    return false;
            });
            if (doRefresh)
                refreshContextSidebar();
        }
    }

    /* mobile alerts and confirmations */
    var alertCallback, confirmTrueCallback, confirmFalseCallback;
    Web.DataView.alert = function (message, callback) {
        if (typeof message != 'string')
            message = message.toString();
        alertCallback = callback;
        var alertBar = $('#app-popup-alert'),
            activePageId = getActivePageId(),
            activePopup = $('div.ui-popup-active div:first');
        if (alertBar.length == 0) {
            alertBar = $(String.format(
                '<div id="app-popup-alert" class="app-popup app-popup-alert" data-theme="a" data-overlay-theme="a" data-dismissible="false" data-history="false">' +
                '<div class="ui-header ui-bar-a" role="banner"><h1 class="ui-title" role="heading" aria-level="1">{0}</h1></div>' +
                '<div role="main" class="ui-content">' +
                '<div class="app-popup-text"></div><div class="app-popup-buttons"><a href="#" class="ui-btn ui-corner-all ui-mini">{1}</a></div>' +
                '</div>' +
                '</div>',
                mobile.appName(), resourcesModalPopup.Close)).appendTo($body).popup(defaultPopupOptions());
            alertBar.find('a').on('vclick', function (e) {
                if (activePopup.length) {
                    popupCloseCallback = function () {
                        activePopup.popup('open');
                    }
                    popupOpenCallback = alertCallback;
                }
                else
                    popupCloseCallback = alertCallback;
                callWithFeedback(this, function () {
                    closePopup(alertBar);
                });
                return false;
            });
        }
        var messageElem = alertBar.find('.app-popup-text');
        message = (message || '').replace(/\n/g, '<p/>');
        if (message.match(/<\w+/))
            messageElem.html(message);
        else
            messageElem.text(message);
        function showAlert() {
            alertBar.popup('open');
        }
        if (activePopup.length) {
            popupCloseCallback = showAlert;
            closePopup(activePopup);
        }
        else
            showAlert();
    }

    Web.DataView.confirm = function (message, trueCallback, falseCallback) {
        if (typeof message != 'string')
            message = message.toString();
        confirmTrueCallback = trueCallback;
        confirmFalseCallback = falseCallback;
        var confirmBar = $('#app-popup-confirm'),
            activePageId = getActivePageId(),
            activePopup = $('div.ui-popup-active div:first');
        if (confirmBar.length == 0) {
            confirmBar = $(String.format(
                '<div id="app-popup-confirm" class="app-popup app-popup-confirm" data-role="popup" data-theme="a" data-overlay-theme="a" data-dismissible="false" data-history="false">' +
                '<div class="ui-header ui-bar-a" role="banner"><h1 class="ui-title" role="heading" arial-level="1">{0}</h1></div>' +
                '<div role="main" class="ui-content"><div class="app-popup-text"></div><div class="app-popup-buttons"><a href="#" class="app-btn-confirm ui-btn ui-corner-all ui-mini">{1}</a><a href="#" class="ui-btn ui-corner-all ui-mini">{2}</a></div></div>' +
                '</div>',
                mobile.appName(), resourcesModalPopup.OkButton, resourcesModalPopup.CancelButton)).appendTo($body).popup(defaultPopupOptions());
            confirmBar.find('a').on('vclick', function (event) {
                var confirmed = $(event.target).is('.app-btn-confirm');
                if (activePopup.length) {
                    popupCloseCallback = function () {
                        activePopup.popup('open');
                        popupOpenCallback = confirmed ? confirmTrueCallback : confirmFalseCallback;
                    }
                }
                else
                    popupCloseCallback = confirmed ? confirmTrueCallback : confirmFalseCallback;
                callWithFeedback(this, function () {
                    closePopup(confirmBar);
                });
                return false;
            });
        }
        var messageElem = confirmBar.find('.app-popup-text');
        message = (message || '').replace(/\n/g, '<p/>');
        if (message.match(/<\w+/))
            messageElem.html(message);
        else
            messageElem.text(message);
        function showConfirm() {
            confirmBar.popup('open');
        }
        if (activePopup.length) {
            popupCloseCallback = showConfirm;
            closePopup(activePopup);
        }
        else
            showConfirm();
    }

    $app.showMessage = function (message) {
        if (message)
            this.alert(message);
    }


    /* menu */

    Web.Menu.headerIterators = [];
    Web.Menu.footerIterators = [];

    Web.Menu.prototype.initialize = function () {
        Web.Menu.callBaseMethod(this, 'initialize');
    };

    Web.Menu.prototype.dispose = function () {
    };

    Web.Menu.prototype.updated = function () {
        Web.Menu.callBaseMethod(this, 'updated');
        if (mobile)
            this.mobileUpdated();
    };

    Web.Menu.prototype.mobileUpdated = function () {
        if (!Web.Menu.MainMenuId) {
            Web.Menu.MainMenuId = this.get_id();
            Web.Menu.MainMenuElemId = this._element.id;
        }
        var nodes = this.get_nodes();
        if (!nodes) return;

        var contextButton = $('#app-btn-context').on('vclick', function () {
            if (mobile.busy()) return;
            blurFocusedInput();
            callWithFeedback(contextButton, function () {
                if (advancedSearchPageIsActive()) {
                    switchToQuickFind();
                }
                else
                    mobile.showContextMenu({ scope: '' });
            });
            return false;
        });

        Web.Menu.footerIterators.unshift(function (depth) {
            if ($(this).is('.level0')) {
                var settingsItem = $('<a/>').text(resourcesMobile.Settings).appendTo($('<li data-icon="gear" data-theme="b"/>').appendTo(this)).on('vclick', function () {
                    if (!skipMenuActionOnClose)
                        activeLink(settingsItem);
                    menuActionOnClose = function () {
                        mobile.contextScope('_contextMenu');
                        configureSettings();
                    }
                    closeActivePanel(true);
                });
                return true;
            }
        });

        var menuButton = $('a#app-btn-menu'),
            menuPanel,
            activePanel;
        menuButton.on('vclick', function (e) {
            blurFocusedInput();
            activeLink(menuButton, false);
            blurFocusedInput();
            if (menuButton.attr('href') == '#app-back') {
                setTimeout(function () {
                    activeLink();
                    history.go(-1);
                }, 200);
                return false;
            }

            function toggleActivePanel(delay) {
                setTimeout(function () {
                    activeLink();
                    if (menuStripIsVisible())
                        mobile._menuPanel.panel('toggle');
                    else
                        activePanel.panel('toggle');
                }, delay);
            }

            if (!menuPanel) {
                setTimeout(function () {
                    activeLink();
                    var page = $('div[data-role="page"]'),
                        panelList = $();
                    mobile._menuPanel = menuPanel = $('<div id="app-panel-menu" data-role="panel" data-position="left" data-position-fixed="true" data-display="overlay" data-theme="b" class="app-nav-panel"/>').appendTo($body);
                    var leftList = $('<ul data-role="listview"><li data-role="list-divider" data-theme="a" class="app-info"><span class="appname"/><p class="welcome"/></li></ul>')
                            .appendTo($('<div class="ui-panel-inner">').appendTo(menuPanel))/*,
                        closeButton = leftList.find('a:first').html(resourcesModalPopup.Close)
                            .on('vclick', function () {
                                if (!clickable(closeButton))
                                    return false;
                                callWithFeedback(closeButton, function () {
                                    menuPanel.panel('close');
                                });
                            })*/,
                        appInfo = menuPanel.find('li[data-role="list-divider"]');
                    appInfo.find('.appname').text(mobile.appName());
                    var headerIterators = Web.Menu.headerIterators,
                        footerIterators = Web.Menu.footerIterators,
                        hasHeaderItems;
                    if (headerIterators.length == 0)
                        appInfo.find('.welcome').hide();
                    else
                        $(headerIterators).each(function () {
                            if (this.call(leftList))
                                hasHeaderItems = true;
                        });
                    if (hasHeaderItems)
                        $('<li data-role="list-divider" data-theme="b"/>').appendTo(leftList);
                    var nodes = $find(Web.Menu.MainMenuId).get_nodes(),
                        activePanelDepth = -1;
                    (function populateMenuLevel(nodes, parentNode, panel, list, depth) {
                        var levelClass = 'level' + depth;
                        panel.addClass(levelClass);
                        list.addClass(levelClass);
                        panelList = panelList.add(panel);
                        $(nodes).each(function (index) {
                            var n = this,
                                url = n.url,
                                hasSelectedChild;
                            if (n.children) {
                                $(n.children).each(function () {
                                    if (this.selected)
                                        hasSelectedChild = true;
                                });
                                var parentPanelId = panel.attr('id'),
                                    childPanelId = parentPanelId + '-' + index,
                                    originalUrl = url;
                                url = '#'/* + childPanelId*/;
                                var childPanel = $('<div data-role="panel" data-position="left" data-position-fixed="true" data-theme="b" data-display="overlay" class="app-nav-panel"/>').appendTo($body).attr('id', childPanelId),
                                    childList = $('<ul data-role="listview" data-theme="b"/>').appendTo($('<div class="ui-panel-inner"/>').appendTo(childPanel));
                                $('<a>').appendTo($('<li data-icon="arrow-u" data-theme="b"/>').appendTo(childList)).attr({ /*'href': '#', */'data-for': parentPanelId }).text(resourcesMobile.UpOneLevel);
                                $('<li data-role="list-divider" data-theme="b"/>').appendTo(childList);
                                $('<a rel="external" class="app-btn-icon-transparent"/>').appendTo(
                                    $('<li>').appendTo(childList).attr({ 'data-theme': n.selected && !hasSelectedChild ? 'a' : 'b', 'data-icon': n.selected && !hasSelectedChild ? 'check' : 'false' })
                                    ).attr('href', originalUrl).text(n.title);
                                if (n.selected/* && !activePanel*/ && depth > activePanelDepth) {
                                    activePanel = childPanel;
                                    activePanelDepth = depth;
                                }
                                populateMenuLevel(n.children, n, childPanel, childList, depth + 1);
                            }
                            if (n.selected/* && !activePanel*/ && depth > activePanelDepth) {
                                activePanel = panel;
                                activePanelDepth = depth;
                            }
                            //if (parentNode && n.selected)
                            //    parentNode.selected = true;
                            var link = $('<a rel="external" class="app-btn-icon-transparent"/>').appendTo(
                                $('<li>').appendTo(list).attr({
                                    'data-icon': n.children ? 'dots' : (n.selected ? 'check' : 'false'),
                                    'class': n.children ? 'menu-item menu-parent' : 'menu-item',
                                    'data-theme': n.selected ? 'a' : 'b'
                                })
                                ).attr({ href: url, title: n.description }).text(n.title);
                            if (n.children)
                                link.attr('data-for', childPanelId);

                        });
                    })(nodes, null, menuPanel, leftList, 0);
                    var lists = panelList.find('ul')
                        .each(function () {
                            var ul = $(this),
                                hasDivider;
                            $(footerIterators).each(function () {
                                if (this.call(ul))
                                    if (!hasDivider) {
                                        hasDivider = true;
                                        $('<li data-role="list-divider" data-theme="b"/>').insertBefore(ul.find('li:last'));
                                    }
                            });
                        }),
                        copyright = $('#PageFooterBar');

                    if (copyright.length) {
                        //$('<li data-role="list-divider" data-theme="b"/>').appendTo(leftList);
                        $('<li data-role="list-divider" class="app-wrap app-copy" data-theme="b"/>').appendTo(leftList);
                    }
                    lists.listview().on('vclick', 'a', function (event) {
                        var link = $(event.target),
                            targetPanelId = link.attr('data-for'),
                            href = link.attr('href');
                        if (!clickable(link))
                            return false;
                        if (!skipMenuActionOnClose) {
                            activeLink(link);
                            if (!targetPanelId && href)
                                busyBeforeUnload();
                        }
                        if (!menuActionOnClose)
                            menuActionOnClose = function () {
                                setTimeout(function () {
                                    if (targetPanelId) {
                                        activePanel = $('#' + targetPanelId);
                                        toggleActivePanel();
                                    }
                                    else
                                        _window.location.href = href;
                                }, 200);
                            }
                        closeActivePanel(targetPanelId != null);
                        return false;
                    }).on('swipe', function () {
                        skipMenuActionOnClose = true;
                    });

                    if (copyright.length)
                        leftList.find('.app-wrap').html(copyright.html());

                    updateMenuStripState();

                    menuPanel = panelList.panel({
                        animate: enablePanelAnimation(),
                        beforeopen: function (event, ui) {
                        },
                        open: function () {
                            activePanel = $(this);
                        },
                        beforeclose: function () {
                        },
                        close: function () {
                            if (!skipMenuActionOnClose && menuActionOnClose)
                                menuActionOnClose();
                            menuActionOnClose = null;
                            skipMenuActionOnClose = false;
                        }
                    });
                    enablePanelAnimation(menuPanel);
                    registerPanelScroller(menuPanel);
                    //panelList.each(function () {
                    //});
                    if (!activePanel)
                        activePanel = panelList.slice(0, 1);
                    toggleActivePanel(250);
                }, 200);
            }
            else {
                toggleActivePanel(200);
            }
            return false;
        });

        $('div[data-app-role="sitemap"]').attr('class', 'app-site-map').each(function () {
            var siteMap = $(this),
                list = $('<ul data-inset="false" />').appendTo(siteMap),
                isLoggedIn = membership && membership.loggedIn();
            function addLoginStatus() {
                var link = $('<li><a href="#" rel="external"/></li>').appendTo(list).find('a');
                if ($('#app-welcome').length && !isLoggedIn)
                    link.attr('href', '#app-welcome').text(resourcesMembershipBar.LoginButton);
                else
                    membership.loginStatus(link);
            }
            if (membership && !isLoggedIn)
                addLoginStatus();
            (function buildHierarchy(level, list, depth) {
                $(level).each(function () {
                    var item = $('<li/>').appendTo(list).addClass('app-depth' + depth);
                    if (this.url)
                        $('<a/>').appendTo(item).attr({ 'href': this.url, 'rel': 'external' }).text(this.title);
                    else
                        $('<span></span>').appendTo(item).text(this.title);
                    if (this.children)
                        buildHierarchy(this.children, list, depth + 1);

                });
            })(nodes, list, 1);
            if (membership && isLoggedIn)
                addLoginStatus();
            list.listview().on('vclick', 'a[rel="external"]', function (event) {
                var link = $(event.target),
                    href = link.attr('href'),
                    hrefIsPageId = href.match(/^#/);
                if (!clickable(link))
                    return false;
                if (!hrefIsPageId)
                    busyBeforeUnload();
                callWithFeedback(link, function () {
                    if (hrefIsPageId)
                        mobile.changePage(href.substring(1));
                    else {
                        activeLink(link, false);
                        _window.location.href = href;
                    }
                });
                return false;
            }).filterable({ filterPlaceholder: resourcesMobile.FilterSiteMap });
        });
    }

    /* membership bar */

    if (typeof Web.Membership != 'undefined') {

        Web.Membership.prototype.initialize = function () {
            var that = this;
            var authenticationEnabled = that.get_authenticationEnabled();
            var displayMyAccount = that.get_displayMyAccount();
            var loggedIn = that.loggedIn();
            Web.Menu.headerIterators.push(function () {
                var parentList = $(this),
                    cultures = that.get_cultures(), // initialize the language selector
                    result;
                if (!String.isNullOrEmpty(cultures) && !(__tf != 4)) {
                    var selectedCulture = { value: 'Detect,Detect', text: resourcesMembershipBar.AutoDetectLanguageOption, selected: false };
                    var cultureList = [selectedCulture];
                    var selected = null;
                    $(cultures.split(/;/)).each(function () {
                        if (this.length) {
                            var info = this.split('|');
                            var culture = { value: info[0], text: info[1], selected: info[2] == 'True' };
                            cultureList.push(culture);
                            if (culture.selected)
                                selectedCulture = culture;
                        }
                    });
                    var languageItem = $('<a/>').text(selectedCulture.text).appendTo($('<li data-icon="location" data-theme="b"/>').appendTo(parentList))
                        .on('vclick', function () {
                            if (!skipMenuActionOnClose)
                                activeLink(languageItem);
                            menuActionOnClose = function () {
                                currentContext = [
                                    {
                                        text: resourcesMobile.Back, icon: 'back', callback: function () {
                                            mobile._menuPanel.panel('toggle');
                                        }
                                    },
                                    { text: resourcesMembershipBar.ChangeLanguageToolTip, instruction: true }]
                                $(cultureList).each(function (index) {
                                    var culture = this;
                                    currentContext.push({
                                        text: culture.text, icon: index == 0 ? '' : (culture.selected ? 'check' : false), context: culture, callback: function (newCulture) {
                                            that.changeCulture(newCulture.value);
                                        }
                                    });
                                    if (index == 0)
                                        currentContext.push({});
                                });
                                showContextPanel(currentContext, '#app-panel-languague', { position: 'left' });
                            }
                            closeActivePanel(true);
                            return false;
                        });
                    result = true;
                }
                // update the welcome message and create Login link when needed
                var welcomePlacehoder = this.find('.welcome');
                if (loggedIn) {
                    var welcome = that.get_welcome();
                    if (String.isNullOrEmpty(welcome))
                        welcomePlacehoder.hide();
                    else
                        welcomePlacehoder.html(String.localeFormat(welcome, that.get_user(), new Date()));
                }
                else if (that._allowLoginInMenu) {
                    welcomePlacehoder.hide();
                    var loginItem = $('<a/>').text(resourcesMembershipBar.LoginLink).appendTo($('<li data-icon="lock" data-theme="b"/>').appendTo(parentList));
                    loginItem.on('vclick', function () {
                        if (!skipMenuActionOnClose)
                            activeLink(loginItem);
                        menuActionOnClose = function () {
                            activeLink();
                            that.showLogin();
                        }
                        closeActivePanel();
                    });
                    result = true;
                }
                return result;
            });
            if (loggedIn && (displayMyAccount || authenticationEnabled))
                Web.Menu.footerIterators.push(function (depth) {
                    var result = false;
                    if (displayMyAccount && $(this).is('.level0') && false) {
                        $(String.format('<li>{0}</li>', resourcesMembershipBar.MyAccount)).appendTo(this);
                        result = true;
                    }
                    if (authenticationEnabled) {
                        var logoutItem = $('<a/>').text(resourcesMembershipBar.LogoutLink).appendTo($('<li data-icon="power" data-theme="b"/>').appendTo(this));
                        logoutItem.on('vclick', function () {
                            if (!skipMenuActionOnClose)
                                activeLink(logoutItem);
                            menuActionOnClose = function () {
                                halt();
                                that.logout();
                            }
                            closeActivePanel();
                        });
                        result = true;
                    }
                    return result;
                });
        };

        Web.Membership.prototype.dispose = function () {
        };

        Web.Membership.prototype.updated = function () {
            membership = this;
            userActivity();
            if (this.get_idleTimeout())
                $(document).on('awake.app', function (event) {
                    return !membership.idle();
                });
            this.idleInterval(true);
            if (mobile)
                this.mobileUpdated();
        };

        Web.Membership.prototype._idle = function () {
            blurFocusedInput();
            var that = this;
            that.idleInterval(false);
            $app.alert(resourcesMembershipBar.UserIdle, function () {
                halt();
                that.logout();
            });
        };

        Web.Membership.prototype.loginStatus = function (selector) {
            var that = this,
                loggedIn = that.loggedIn(),
                loginStatus = $(selector).text(loggedIn ? resourcesMembershipBar.LogoutLink : resourcesMembershipBar.LoginLink).on('vclick', function (e) {
                    callWithFeedback(loginStatus, function () {
                        if (loggedIn) {
                            halt();
                            that.logout();
                        }
                        else
                            that.showLogin();
                    });
                    return false;
                });
        }

        Web.Membership.prototype.mobileUpdated = function () {
            var that = this,
                activePageId,
                loggedIn;

            function showLogin() {
                if (isInTransition)
                    setTimeout(showLogin, 200);
                else if (!that.loggedIn() && activePageId == getActivePageId())
                    that.showLogin();
            }

            $(document).on('start.app', function () {
                //setTimeout(function () {
                //    $app.alert($window.width() + ' / ' + $window.height());
                //}, 1000);
                that._allowLoginInMenu = that.get_displayLogin(); // $mobile.activePage.attr('data-app-login') != 'custom';
                if (!loggedIn && location.href.match(/(\?|&)ReturnUrl=/))
                    if (that._allowLoginInMenu) {
                        activePageId = getActivePageId()
                        setTimeout(showLogin, 1000);
                    }
            });
            this.loginStatus('a[data-app-role="loginstatus"]');
        };
        Web.Membership.prototype.showLogin = function () {
            var loginDialog = this._loginDialog;
            if (!loginDialog) {
                this._login_CompletedHandler = Function.createDelegate(this, this._login_Completed);
                this._method_FailureHandler = Function.createDelegate(this, this._method_Failure);
                loginDialog = this._loginDialog = $(String.format(
                    '<div id="app-popup-login" data-role="popup" data-theme="a" data-overlay-theme="a" class="app-popup app-popup-login">' +
                    '<div role="banner" class="ui-header ui-bar-a"><h1 class="ui-title" role="heading" aria-level="1">{6}</h1></div>' +
                    '<div role="main" class="ui-content">' +
                    '<div><label for="UserName">{1} {2}</label></div><input type="text" id="UserName" placeholder="{3}"/><input type="password" id="Password" placeholder="{4}"/>{5}' +
                    '<div class="app-popup-buttons"><a href="#" class="login-button ui-btn ui-corner-all ui-mini">{7}</a></div>' +
                    '</div></div>',
                        resourcesMembershipBar.HelpCloseButton, resourcesMembershipBar.LoginLink, resourcesMembershipBar.LoginText, resourcesMembershipBar.UserName.replace(/:/, ''), resourcesMembershipBar.Password.replace(/:/, ''),
                        this.get_displayRememberMe() ? String.format('<label for="RememberMe"><input type="checkbox" id="RememberMe" />{0}</label>', resourcesMembershipBar.RememberMe) : '',
                        mobile.appName(), resourcesMembershipBar.LoginButton)
                       ).appendTo($body).popup(defaultPopupOptions());
                var that = this;
                this._userName = loginDialog.find('input:text').textinput().get(0);
                this._password = loginDialog.find('input:password').textinput().get(0);
                this._rememberMe = loginDialog.find('input:checkbox').checkboxradio().get(0);
                var loginButton = loginDialog.find('a.login-button').on('vclick', function () {
                    blurFocusedInput();
                    callWithFeedback(loginButton, function () {
                        activeLink(loginButton, false);
                        that.login();
                    });
                    return false;
                });
                loginDialog.find('input').on('keydown', function (event) {
                    if (event.which == 13) {
                        blurFocusedInput();
                        setTimeout(function () {
                            loginButton.trigger('vclick');
                        }, 200);
                        return false;
                    }
                });
            }
            loginDialog.popup('open');
        };

    };

    Web.Mobile = function () {
        var that = this;
        that._asyncJob = 0;
        that._pageMap = {};
        that._pages = [];
        that._toolbar = $('#app-bar-tools');
        that._actionButton = $('.app-btn-promo');
        that._toolbarButtons = that._toolbar.find('.app-btn');
        that._title = that._toolbar.find('h1');
        that._headingBar = $('#app-bar-heading');
        that._menuButton = $('#app-btn-menu');
        that._contextButton = $('#app-btn-context');
        that._modalDataViews = [];
        that._modalStack = [];
    }

    Web.Mobile.prototype = {
        settings: function () {
            return settings;
        },
        appName: function () {
            return $('#PageHeaderBar').text();
        },
        height: function () {
            var height = $window.height();
            if (navigator.userAgent.match(/Mobile.+Safari/) && !navigator.userAgent.match(/Chrome/))
                height += 60;
            return height;
        },
        page: function (id) {
            if (!id)
                id = 'Main';
            var p = $('#' + id);
            if (p.length == 0) {
                p = $(String.format('<div data-role="page" id="{0}"><div data-role="content"/></div>', id)).appendTo($body).page();
                var activePage = $mobile.activePage,
                    minHeight = activePage.css('min-height'),
                    paddingTop = activePage.css('padding-top'),
                    info = this.pageInfo(id);
                createScroller(p);
                resetPageHeight(p);
            }
            return p;
        },
        activeLink: function (elem, autoRemove) {
            if (!$($mobile.activeClickedLink).is('.app-tab-active'))
                $mobile.removeActiveLinkClass(true);
            if (elem) {
                elem = $(elem).closest('a');
                if (!elem.is('.app-btn-static')) {
                    elem.addClass('ui-btn-active');
                    if (autoRemove == null || autoRemove)
                        $mobile.activeClickedLink = elem;
                }
            }
        },
        blink: function (elem, callback) {
            activeLink(elem);
            setTimeout(function () {
                activeLink();
                setTimeout(function () {
                    activeLink(elem);
                    setTimeout(function () {
                        activeLink();
                        if (callback)
                            callback();
                    }, 200);
                }, 200);
            }, 200);
        },
        content: function (id) {
            var p = this.page(id),
                c = p.find('div[data-role="content"] .app-wrapper:last');
            return c.length ? c : p.find('div[data-role="content"]');
        },
        showContextPanel: function (context, id, options) {
            showContextPanel(context, '#' + id, options);
        },
        toggleContextPanel: function (id) {
            if (this.contextScope())
                id += '-scope';
            $(id).panel('toggle');
        },
        causesCalculate: function (value) {
            if (arguments.length == 0)
                return calculateCausedBy.length ? calculateCausedBy[0] : null;
            else if (value == false) {
                if (calculateCausedBy.length)
                    calculateCausedBy.splice(0, 1);
                calculateLastCausedBy = null;
            }
            else
                calculateCausedBy.push(value);
        },
        callAfterCalculate: function (callback) {
            callAfterCalculate(callback);
        },
        pageVar: function (name, value) {
            if (arguments.length == 1)
                return pageVariable(name);
            pageVariable(name, value);
        },
        userVar: function (name, value) {
            if (arguments.length == 1)
                return userVariable(name);
            userVariable(name, value);
        },
        callWithFeedback: function (link, callback) {
            callWithFeedback(link, callback);
            //isInTransition = false;
        },
        dataView: function () {
            var pageInfo = this.pageInfo();
            return pageInfo ? pageInfo.dataView : null;
        },
        prevPageInfo: function () {
            var stack = $mobile.navigate.history.stack,
                prevPageId, prevPage;
            if (stack.length > 1) {
                prevPageId = stack[stack.length - 2].pageUrl;
                if (prevPageId) {
                    prevPage = mobile.pageInfo(prevPageId);
                }
            }
            return prevPage;
        },
        pageInfo: function (value) {
            if (!value)
                value = getActivePageId();
            else
                if (value.selector != null && value.length != null)
                    value = value.attr('id') || '';
            if (typeof value == 'string')
                return this._pageMap[value];
            else
                if (!value)
                    return null;
                else {
                    this._pageMap[value.id] = value;
                    if (value.dataView && value.dataView._id)
                        this._pageMap[value.dataView._id] = value;
                    this._pages.push(value);
                }
        },
        dataViewUIPage: function (dataView) {
            return $('#' + dataView._id);
        },
        dataViewUILinks: function (dataView) {
            return this.dataViewUIPage(dataView).find('ul[data-role="listview"] li a');
        },
        unloading: function () {
            busyBeforeUnload();
        },
        listPopup: function (options) {
            showListPopup(options);
        },
        promo: function (value, tooltip) {
            var button = this._actionButton,
                icon;
            function showButton() {
                if (button.is('.ui-disabled') || !settings.promoteActions)
                    button.hide();
                else if ($('.ui-popup-active').length)
                    button.hide().addClass('app-hidden');
                else
                    button.show();
            }

            if (arguments.length == 0)
                return button;
            else if (typeof value == 'boolean')
                if (value)
                    showButton();
                else
                    button.hide();
            else if (typeof value == 'string') {
                icon = button.data('icon');
                if (icon)
                    button.removeClass('ui-icon-' + icon);
                button.addClass('ui-icon-' + value).data('icon', value).attr('title', tooltip);
                if (value.match(/(delete|minus|trash)/)) {
                    button.hide().addClass('ui-disabled');
                    return false;
                }
                else {
                    button.removeClass('ui-disabled');
                    showButton();
                    return true;
                }
            }
            /*else {
            if (value.length == 0) {
            var dataView = mobile.dataView();
            if (dataView && dataView.get_isGrid() && !dataView.get_selectedKey().length && button.data('icon'))
            showButton();
            else
            button.hide();
            }
            else {
            var scrollable = value.closest('.app-wrapper'),
            scrollableTop = scrollable.offset().top,
            valueTop = value.offset().top;
            if (valueTop < scrollableTop || scrollableTop + scrollable.height() < valueTop + value.outerHeight(true))
            button.hide();
            else
            showButton();
            }
            }*/
        },
        toolbar: function (value) {
            var toolbar = this._toolbar;
            if (typeof value == 'boolean') {
                if (value)
                    toolbar.show();
                else
                    toolbar.hide();
            }
            else if (typeof value == 'string')
                this._title.text(value);
            return toolbar;
        },
        search: function (method, options) {
            var searchInput = $(mobile._searchInput).attr('data-scope', options.scope),
                text = options && options.text,
                searchOptions;

            function blurSearchInput(blurInput) {
                if (blurInput != false)
                    searchInput.blur();
                activeLink();
                mobile._toolbar.removeClass('app-logo-hidden');
                toolbarStandardControls.show();
                toolbarSearchControls.hide();
                refreshContextSidebar();
            }

            // initializes search controls
            function init() {
                toolbarStandardControls = $('.ui-title,#app-btn-menu,.app-btn-cluster-right').hide();
                toolbarSearchControls = mobile._toolbar.find('#app-controls-find');
                if (toolbarSearchControls.length == 0) {
                    toolbarSearchControls = $('<div id="app-controls-find" class="app-bar-search"><form><input type="search" id="app-input-search" data-role="search" data-mini="true"/><a href="#" class="app-btn-search-cancel ui-btn-left ui-btn ui-icon-back ui-btn-icon-notext ui-shadow ui-corner-all"/><a class="app-btn-search-more ui-btn ui-btn-right ui-corner-all ui-btn-icon-notext ui-icon-carat-d"/></form></div>')
                        .insertBefore(mobile._toolbar.find('.ui-title'));
                    toolbarSearchControls.find('.app-btn-search-more').attr('title', resourcesGrid.ShowAdvancedSearch).on('vmousedown', function (event) {
                        if (mobile.busy()) return;
                        var pageInfo = mobile.pageInfo(searchInput.attr('data-scope') || options.scope),
                            dataView = pageInfo.dataView,
                            query = searchInput.val();
                        dataView.extension().useAdvancedSearch(true);
                        callWithFeedback(event.target, function () {
                            blurSearchInput();
                            startAdvancedSearch(dataView, query);
                        });
                        return false;
                    });
                    mobile._searchInput = searchInput = toolbarSearchControls.find('input').textinput({ mini: true, clearBtnText: resourcesMobile.ClearText }).attr('type', 'text')
                        .keydown(function (event) {
                            if (event.keyCode == 27) {
                                searchInput.blur();
                                return false;
                            }
                            else if (event.keyCode == 40 || event.keyCode == 114) {
                                var pageInfo = mobile.pageInfo(searchInput.attr('data-scope') || options.scope),
                                    dataView = pageInfo.dataView,
                                    query = searchInput.val();
                                dataView.extension().useAdvancedSearch(true);
                                callWithFeedback(toolbarSearchControls.find('.ui-icon-carat-d'), function () {
                                    blurSearchInput();
                                    startAdvancedSearch(dataView, query);
                                });
                                return false;
                            }
                        })
                        .focus(function () {
                            mobile._toolbar.addClass('app-logo-hidden');
                        })
                        .blur(function () {
                            var allowBlur = searchInput.data('allow-blur') != false;
                            if (!allowBlur) {
                                searchInput.parent().addClass('ui-focus');
                                return;
                            }

                            hideMenuStrip(true);
                            blurSearchInput(false);
                            setTimeout(function () {
                                // advanced search mode - load the initial data set if user exits the search field
                                var dataView = mobile.dataView();
                                if (dataView && dataView._totalRowCount == -1)
                                    dataView.sync();
                            }, 200);
                        });

                    searchOptions = $('<span class="app-btn-options app-has-children"/>').appendTo(searchInput.parent()).attr('title', resourcesMobile.QuickFindScope).on('vmousedown', function () {

                        function toggleQuickFindHint(context, link) {
                            link.toggleClass('ui-icon-check');
                            options[context]._selected = link.is('.ui-icon-check');
                            var hasSelection;
                            $(options).each(function () {
                                if (this._selected) {
                                    hasSelection = true;
                                    return false;
                                }
                            });
                            if (!hasSelection) {
                                options[context]._selected = true;
                                link.toggleClass('ui-icon-check');
                            }
                        }

                        var pageInfo = mobile.pageInfo(searchInput.attr('data-scope') || options.scope),
                            dataView = pageInfo.dataView,
                            options = [{
                                text: dataView.get_view().Label, icon: true, _hint: dataView._controller + '.' + (dataView._viewId || 'grid1'), keepOpen: true, context: 0, callback: toggleQuickFindHint
                            }],
                            currentQuickFindHint = (dataView.viewProp('quickFindHint') || '').split(';'),
                            hasSelection;
                        $(mobile._pages).each(function () {
                            var page = this,
                                dv = page.dataView;
                            if (dv && dv._filterSource == dataView._id) {
                                if (options.length == 1)
                                    options.push({});
                                options.push({ text: dv.get_view() && dv.get_view().Label || page.text, icon: true, _hint: dv._controller + '.' + (dv._viewId || 'grid1') + '.' + dv._filterFields, keepOpen: true, context: options.length, callback: toggleQuickFindHint });
                            }
                        });

                        $(options).each(function () {
                            var option = this;
                            option._selected = currentQuickFindHint.indexOf(option._hint) != -1;
                            if (option._selected) {
                                option.icon = 'check';
                                hasSelection = true;
                            }
                        });
                        if (!hasSelection) {
                            options[0]._selected = true;
                            options[0].icon = 'check';
                        }

                        searchInput.data('allow-blur', false);
                        showListPopup({
                            anchor: searchOptions, highlightAnchor: false, iconPos: 'right', y: searchOptions.offset().top + searchOptions.outerHeight() * .8,
                            title: resourcesMobile.QuickFindScope,
                            items: options,
                            afteropen: function () {
                                setTimeout(function () {
                                    searchInput.parent().addClass('ui-focus');
                                });
                            },
                            afterclose: function () {
                                searchInput.focus();
                                searchInput.data('allow-blur', null);
                                var quickFindHint = [];
                                $(options).each(function (index) {
                                    var option = this,
                                        dv;
                                    if (option.text && option._selected) {
                                        if (index > 0)
                                            quickFindHint.push(';');
                                        quickFindHint.push(option._hint);
                                    }
                                });

                                dataView.viewProp('quickFindHint', quickFindHint.length == 1 ? null : quickFindHint.join(''));
                            }
                        });
                        return false;
                    });

                    searchInput.parent().find('.ui-input-clear').on('vmousedown', function (event) {
                        inputCaretPos(searchInput, 0);
                        $(this).trigger('click');
                        return false;
                    });

                    toolbarSearchControls.find('form').submit(function (event) {
                        blurSearchInput();
                        execute(searchInput.val());
                        return false;
                    });

                    var cancelSearchButton = toolbarSearchControls.find('.ui-icon-back').attr('title', resourcesModalPopup.CancelButton).on('vclick', function () {
                        callWithFeedback(cancelSearchButton, function () {
                            blurSearchInput();
                        });
                        return false;
                    });
                }
                searchInput.attr('data-scope', options.scope);
                //searchInput.parent().find('.ui-input-clear').off().on('vclick', function () {
                //    $(this).trigger('vmousedown').toggleClass('ui-icon-clear ui-icon-check');
                //    return false;
                //});
            }

            // executes search 
            function execute(query) {
                var pageInfo = mobile.pageInfo(searchInput.attr('data-scope') || options.scope),
                    dataView = pageInfo.dataView,
                    extension = dataView.extension();
                if (dataView._busy())
                    return;
                resetInstruction(dataView);
                quickFind(dataView, query);
                mobile.toolbar(mobile.title());
                enableHeading();
            }

            // implementation of "search" methods
            if (method == 'configure') {
                if (options.focus) {
                    init();
                    toolbarSearchControls.show();
                    hideMenuStrip(false);

                    if (options.placeholder)
                        searchInput.attr('placeholder', options.placeholder);
                    if (text) {
                        searchInput.val(text);
                        var cancelButton = searchInput.parent().find('a');
                        if (text)
                            cancelButton.removeClass('ui-input-clear-hidden');
                        else
                            cancelButton.addClass('ui-input-clear-hidden');
                    }
                    else
                        searchInput.val('');
                    searchInput.focus().select();
                    if (options.setCursor)
                        inputCaretPos(searchInput, searchInput.val().length);
                }
                else {
                    if (toolbarStandardControls)
                        toolbarStandardControls.show();
                    if (toolbarSearchControls)
                        toolbarSearchControls.hide();
                    if (typeof text != 'undefined')
                        searchInput.val(text);
                }
                searchInput.attr('data-scope', options.scope);
            }
            else if (method == 'execute')
                execute(options.text);
            else
                return searchInput.val();
        },
        headingBar: function () {
            return this._headingBar;
        },
        enumerateFields: function (dataView, context, fields, row) {
            // render fields
            var allFields = dataView._allFields,
                summaryOnly = fields == null;
            if (!row)
                row = dataView.extension().commandRow();
            if (summaryOnly) {
                fields = [];
                $(allFields).each(function () {
                    if (this.ShowInSummary && !this.Hidden)
                        fields.push(this);
                });
            }
            else
                context.push({ text: dataView.get_view().Label, theme: 'a', isStatic: false, instruction: true });
            $(fields).each(function () {
                var field = allFields[this.AliasIndex],
                    v = row[field.Index],
                    t = field.text(v);
                if (field.OnDemand) {
                    if (field.OnDemandStyle == 0 && v && !v.match(/^null/))
                        context.push({ src: String.format('{0}blob.ashx?{1}=t|{2}', dataView.resolveClientUrl(dataView.get_appRootPath()), field.OnDemandHandler, v), desc: field.HeaderText, display: 'before' });
                }
                else {
                    if (isPhoneField(field) && v)
                        context.push({ text: t, desc: field.HeaderText, href: 'tel:' + t, icon: 'phone' });
                    else if (isEmailField(field) && v)
                        context.push({ text: t, desc: field.HeaderText, href: 'mailto:' + t, icon: 'mail' });
                    else
                        context.push({ text: t, desc: field.HeaderText, isStatic: true, display: 'before' });
                }
            });
        },
        infoView: function (dataView, standalone, row) {
            var context = [],
                position = standalone ? 'left' : null,
                map, allFields, fields;
            if (!standalone)
                context.push({ text: resourcesMobile.Back, callback: backToContextPanel, icon: 'back' });
            while (dataView) {
                // create a list of fields that matches info bar
                map = dataView.extension().itemMap();
                allFields = dataView._allFields;
                fields = [allFields[map.heading]];
                $(map.desc).each(function () {
                    fields.push(allFields[this]);
                });
                // add extra fields that are not on the info bar
                $(dataView._fields).each(function () {
                    if (!this.Hidden && fields.indexOf(allFields[this.AliasIndex]) == -1)
                        fields.push(this);
                });
                this.enumerateFields(dataView, context, fields, row);
                dataView = $app.find(dataView._filterSource);
            }
            showContextPanel(context, '#app-panel-info-view' + (position ? '-standalone' : ''), { position: position, className: 'app-panel-info-view' });
        },
        modalDataView: function (id) {
            var that = this;
            if (!id) {
                $(that._modalStack).each(function (index) {
                    var pageInfo = this,
                        page = $('#' + pageInfo.id),
                        dataView = pageInfo.dataView;
                    dataView.dispose();
                    page.page('destroy').remove();
                    index = that._modalDataViews.indexOf(pageInfo.id);
                    that._modalDataViews.splice(index, 1);
                    index = that._pages.indexOf(pageInfo);
                    that._pages.splice(index, 1);

                });
                that._modalStack = [];
            }
            else {
                var pageInfo = that.pageInfo(id),
                    page = that.page(id);
                if (_pendingPageText) {
                    pageInfo.text = _pendingPageText;
                    _pendingPageText = null;
                }
                if (!pageInfo.dataView._lookupInfo) {
                    if (!page.is('app-modal-page'))
                        page.addClass('app-modal-page app-form-page');
                    pageInfo.dataView._isModal = true;
                }
                that._modalDataViews.push(id);
                that.changePage(id);
            }
        },
        unloadPage: function (page, activePage) {
            var pageInfo = this.pageInfo(page),
                index;
            if (pageInfo) {
                index = this._modalDataViews.indexOf(pageInfo.id);
                if (index >= 0) {
                    var dataView = pageInfo.dataView,
                        masterView = $app.find(dataView._parentDataViewId),
                        activePageInfo = this.pageInfo(activePage),
                        activePageIndex = activePageInfo ? this._modalDataViews.indexOf(activePageInfo.id) : -1;
                    if (activePageInfo && masterView == activePageInfo.dataView || activePage.attr('id') == 'Main' || activePageIndex >= 0 && index > activePageIndex) {
                        if (this._modalStack.indexOf(pageInfo) == -1)
                            this._modalStack.push(pageInfo);
                    }
                }
            }
        },
        busy: function (value) {
            var that = this,
                result = that._busy == true;
            if (arguments.length == 1)
                that._busy = value;
            else {
                if (result)
                    return true;
                that._busy = true;
                setTimeout(function () {
                    that._busy = false;
                }, 900);
                return false;
            }
        },
        executeInContext: function (icon, text) {
            var context = [];
            mobile.navContext(context);
            $(context).each(function () {
                var action = this;
                if (icon && action.icon == icon || !icon && action.text == text) {
                    if (!mobile.busy())
                        executeContextAction(action);
                    return false;
                }
            });
        },
        navigate: function (id) {
            setTimeout(function () {
                mobile.changePage(id);
            }, 300);
        },
        changePage: function (id, changeHash) {
            var activePage = $mobile.activePage,
                page;
            hideHeadingBar();
            transitionStatus(true);
            if (this.pageInit(id)) {
                page = this.page(id).css('padding-top', activePage.css('padding-top'));
                var defaultTransition = settings.pageTransition,
                    targetPageInfo = this.pageInfo(id),
                    transition = targetPageInfo.home ? 'fade' : (targetPageInfo.transition || defaultTransition),
                    navHistory = $mobile.navigate.history,
                    navStack,
                    dataUrl, asbUrl,
                    navEntry;
                dataUrl = targetPageInfo.replaceUrl;
                $mobile.changePage('#' + id, {
                    changeHash: !(changeHash == false) && !targetPageInfo.home, transition: transition
                });
                navStack = navHistory.stack;
                navEntry = navStack[navStack.length - 1];
                if (dataUrl) {
                    targetPageInfo.replaceUrl = null;
                    absUrl = $mobile.path.makeUrlAbsolute(dataUrl, $mobile.path.documentBase);
                    //dataUrl = $mobile.path.convertUrlToDataUrl(absUrl);
                    $('#' + id).attr('data-url', dataUrl);
                    $mobile.navigate.navigator.squash(dataUrl);
                    navEntry.url = absUrl;
                }
                if (targetPageInfo.home)
                    navEntry.transition = defaultTransition;
            }
        },
        title: function () {
            return title = document.title;
        },
        navContext: function (context, childrenOnly) {
            var that = this,
                activePageInfo = that.contextPageInfo(),
                rootPageInfo = activePageInfo,
                activeDataView = activePageInfo && activePageInfo.dataView,
                rootDataView = activeDataView,
                rootExtension = rootDataView && rootDataView.extension(),
                activeUseCase = activeDataView && activeDataView.get_useCase(),
                activeExtension = activeDataView && activeDataView.extension(),
                firstNavOption = true,
                backInHistory = -1;
            // enumerate data view context options
            if (activeExtension) {
                if (!childrenOnly)
                    if (activeExtension)
                        activeExtension.context(context);
                if (activePageInfo.dataView._parentDataViewId) {
                    activePageInfo = that.pageInfo(activePageInfo.dataView._parentDataViewId);
                    activeDataView = activePageInfo.dataView;
                    backInHistory--;
                }
            }
            if (rootExtension && !rootExtension.inserting() && !rootExtension.lookupInfo())
                $(that._pages).each(function (index) {
                    var pageInfo = this,
                        pageDataView = pageInfo.dataView,
                        pageExtension = pageDataView && pageDataView.extension(),
                        allowNavigate,
                        master = false;
                    if (pageDataView) {
                        allowNavigate = !pageDataView._hidden && !pageDataView._parentDataViewId;
                        if (allowNavigate) {
                            if (activeDataView && activeDataView._filterSource) {
                                allowNavigate = $app.find(activeDataView._filterSource) == pageDataView;
                                master = allowNavigate;
                                if (!allowNavigate)
                                    allowNavigate = $app.find(pageDataView._filterSource) == activeDataView;
                            }
                            else if (pageDataView._filterSource)
                                allowNavigate = $app.find(pageDataView._filterSource) == activeDataView;
                            else
                                allowNavigate = false;
                        }
                    }
                    if (allowNavigate && !activeUseCase && !pageInfo.external) {
                        if (firstNavOption) {
                            if (!childrenOnly)
                                context.push({});
                            firstNavOption = false;
                        }
                        if (master && !that.contextScope())
                            context.push(
                                {
                                    text: that._masterHeading, desc: pageInfo.text, icon: 'info',
                                    callback:
                                        function () {
                                            mobile.infoView(pageDataView, feedbackFrom == 'toolbar');
                                        },
                                    system: true
                                });
                        if (!that.contextScope() || !master)
                            context.push(
                                {
                                    text: master ? resourcesMobile.Back : pageInfo.text/*, desc: master ? this.text : null*/, icon: master ? 'back' : null, /*dataRel: master ? 'back' : null,*/
                                    count: master ? null : (pageExtension && !pageExtension._reset ? pageDataView._totalRowCount : null),
                                    callback: master ?
                                        function () {
                                            _window.history.go(backInHistory);
                                        } :
                                        function () {
                                            that.changePage(pageInfo.id);
                                        },
                                    system: true,
                                    navigateTo: master ? 'master' : 'detail',
                                    context: pageInfo && pageInfo.id,
                                    activator: pageInfo && pageInfo.activator

                                });
                    }
                });
        },
        refreshAppButtons: function (context, options) {
            var that = this,
                titleRight = that._title.offset().left + that._title.outerWidth() - 1,
                btn, icon, toolbar,
                visibleButtons = [], numberOfVisibleButtons,
                icons = [], iconLabels = { search: resourcesGrid.PerformAdvancedSearch },
                usedIcons = [],
                hasCall, hasRefresh, hasEye, hasEmail, hasSearch,
                dataView = mobile.dataView(),
                firstVisibleButton = 0, i,
                contextButton = that._contextButton,
                buttonBars = options && options.buttonBars || $mobile.activePage.find('.app-bar-buttons');
            if (!options || options.toolbar) {
                if (advancedSearchPageIsActive())
                    contextButton.show().attr('title', resourcesGrid.HideAdvancedSearch).addClass('ui-icon-carat-u').removeClass('ui-icon-dots');
                else {
                    contextButton.attr('title', resourcesMobile.More).removeClass('ui-icon-carat-u').addClass('ui-icon-dots');
                    if (context.length)
                        contextButton.show();
                    else
                        contextButton.hide();
                }
                that._toolbarButtons.each(function () {
                    btn = $(this);
                    btn.show();
                    if (btn.offset().left > titleRight)
                        visibleButtons.push(btn);
                    btn.hide();
                });
                numberOfVisibleButtons = visibleButtons.length;
                if (numberOfVisibleButtons > 0) {
                    $(context).each(function () {
                        var option = this;
                        icon = option.icon;
                        showOnToolbar = option.toolbar != false && icon != 'dots' && icon != 'back';
                        if (icon) {
                            if (icon == 'search')
                                hasSearch = true;
                            else if (icon == 'refresh')
                                hasRefresh = true;
                            else if (icon == 'phone')
                                hasCall = true;
                            else if (icon == 'mail')
                                hasEmail = true;
                            else if (icon == 'eye' && showOnToolbar)
                                hasEye = true;
                            else if (showOnToolbar && icons.indexOf(icon) == -1)
                                icons.push(icon);
                            else
                                icon = null;
                            if (icon)
                                iconLabels[icon] = option.text + (option.desc ? '\n' + option.desc : '');
                        }
                    });
                    if (hasEmail)
                        icons.push('mail');
                    if (hasCall)
                        icons.push('phone');
                    if (hasEye)
                        icons.push('eye');
                    if (hasRefresh)
                        icons.push('refresh');
                    if (icons.length && dataView && dataView.get_isGrid() && !dataView.get_isEditing() && settings.promoteActions) {
                        if (mobile.promo(icons[0], iconLabels[icons[0]])) {
                            mobile.promo().data('icon-list',
                                hasEye ?
                                    {
                                        icons: icons.slice().reverse(),
                                        labels: iconLabels
                                    } :
                                    null);
                            usedIcons.push(icons[0]);
                            icons.splice(0, 1);
                        }
                    }
                    else if (advancedSearchPageIsActive())
                        promoteSearch();
                    else
                        mobile.promo(false);
                    if (hasSearch)
                        if (icons.length < numberOfVisibleButtons)
                            icons.push('search');
                        else
                            icons[numberOfVisibleButtons - 1] = 'search';
                    if (icons.length < numberOfVisibleButtons)
                        firstVisibleButton = numberOfVisibleButtons - icons.length;
                    for (i = 0; i < firstVisibleButton; i++)
                        $(visibleButtons[i]).hide();
                    while (i < numberOfVisibleButtons) {
                        btn = $(visibleButtons[i]);
                        icon = icons[i - firstVisibleButton];
                        var lastIcon = btn.data('icon');
                        btn.removeClass('ui-icon-' + lastIcon).addClass('ui-icon-' + icon).data('icon', icon).show();
                        btn.attr('title', iconLabels[icon]);
                        usedIcons.push(icon);
                        i++;
                    }
                }
            }
            if (buttonBars.length) {
                var firstBar,
                    buttons;
                buttonBars.each(function (barIndex) {
                    var bar = $(this),
                        button, moreButton,
                        buttonList,
                        barWidth, totalWidthOfButtons, additionalWidth;
                    if (bar.is(':visible')) {
                        bar.children().remove();
                        if (firstBar)
                            bar.append(firstBar.html());
                        else {
                            firstBar = bar;
                            if (!buttons) {
                                buttons = [];
                                $(context).each(function () {
                                    var option = this,
                                        icon = option.icon;
                                    if (!option.system && icon != 'dots' && option.text && option.uiScope == 'Form')
                                        buttons.push(option);
                                });
                            }
                            $(buttons).each(function () {
                                var option = this;
                                $('<a href="#app-action" class="ui-btn ui-corner-all ui-mini"/>').text(option.text).appendTo(bar);
                            });
                            barWidth = bar.width();
                            button = bar.find('.ui-btn:last');
                            if (button.length && (button.position().left + button.outerWidth() > barWidth)) {
                                bar.find('.ui-btn').css('min-width', '8em');
                                if (button.length && (button.position().left + button.outerWidth() > barWidth)) {
                                    bar.find('.ui-btn').css('min-width', '4em');
                                    if (button.length && (button.position().left + button.outerWidth() > barWidth)) {
                                        moreButton = $('<a href="#app-action" class="ui-btn ui-corner-all ui-mini app-btn-more"/>').html('&nbsp;').attr('title', resourcesMobile.More).appendTo(bar);
                                        while (button.length && moreButton.position().left + moreButton.outerWidth() > barWidth)
                                            button = button.hide().prev();
                                    }
                                    if (!$body.is('.app-buttons-text-only')) {
                                        totalWidthOfButtons = 0;
                                        buttonList = bar.find('.ui-btn:visible').each(function () {
                                            totalWidthOfButtons += $(this).outerWidth(true);
                                        });
                                        additionalWidth = Math.ceil((barWidth - totalWidthOfButtons) / (buttonList.length - (moreButton ? 1 : 0)));
                                        bar.find('.ui-btn:visible:not(.app-btn-more)').each(function () {
                                            var btn = $(this);
                                            btn.width(btn.width() + additionalWidth);
                                        });
                                    }
                                }
                            }
                        }
                    }
                });
            }
            while (usedIcons.length) {
                i = 0;
                while (i < context.length)
                    if (context[i].icon == usedIcons[0]) {
                        context.splice(i, 1);
                        usedIcons.splice(0, 1);
                    }
                    else
                        i++;
            }
        },
        endModalState: function (dataView, contextDataView, callback) {
            var dataViewPage = this.pageInfo(dataView._id),
                contextDataViewPage = this.pageInfo(contextDataView._id);
            dataViewPage.refreshCallback = function () {
                history.go(-1);
            }
            pageChangeCallback = function () {
                hideHeadingBar();
                $mobile.navigate.history.clearForward();
                mobile.modalDataView();
                var parentDataView = dataView.get_parentDataView(),
                    parentPageInfo;
                if (parentDataView) {
                    parentPageInfo = mobile.pageInfo(parentDataView._id);
                    parentPageInfo.echoChanged = true;
                    if (!parentDataView.get_isEditing())
                        parentPageInfo.initCallback = function () {
                            parentDataView.sync();
                        }
                }
                if (callback)
                    if (dataViewPage.echoInitialized != null && dataViewPage.id != getActivePageId())
                        dataViewPage.echoRefreshCallback = callback;
                    else
                        callback();
            }
            busyIndicator(true);
            dataViewPage.requiresReturnCallback = true;
            dataView.sync();
        },
        renderContext: function (listview, context, filter) {
            var lastItemIsSeparator = false;
            $(context).each(function () {
                if (filter && !filter(this))
                    return;
                var option = this,
                    item = $('<li>')
                    .attr({
                        'data-icon': option.icon,
                        'data-theme': option.theme || 'a'
                    }).appendTo(listview),
                    link,
                    isSeparator = false,
                    separator;
                if (option.callback || option.dataRel) {
                    link = $('<a href="#"/>').appendTo(item).text(option.text).data('context-action', option);
                    if (option.count != null)
                        $('<span class="ui-li-count"/>').appendTo(link).text(option.count);
                    if (option.dataRel)
                        link.attr('data-rel', option.dataRel);
                }
                else if (option.href) {
                    item.attr('data-icon', option.icon);
                    link = $('<a href="#" rel="external"/>').appendTo(item).text(option.text).data('context-action', option).attr('href', option.href);
                }
                else if (option.isStatic)
                    item.html(option.text); //.find('a').attr('rel', 'external')
                else if (option.src)
                    $('<img class="ui-li-thumb"/>').appendTo(item.addClass('ui-li-has-thumb')).attr({ src: option.src });
                else {
                    if (lastItemIsSeparator)
                        item.remove();
                    else {
                        separator = item.attr('data-role', 'list-divider').html(option.text);
                        if (!option.isStatic && option.text && option.instruction != false)
                            separator.addClass('app-list-instruction');
                    }
                    lastItemIsSeparator = true;
                    isSeparator = true;
                }
                if (!isSeparator)
                    lastItemIsSeparator = false;
                if (option.desc) {
                    var displayBefore = option.display == 'before',
                        para;
                    if (displayBefore)
                        $('<p class="app-item-desc app-item-desc-before"/>').insertBefore((link ? link : item).contents()).text(option.desc);
                    para = $('<p class="app-item-desc"/>').appendTo(link ? link : item).text(option.desc);
                    if (displayBefore)
                        para.addClass('app-item-desc-after');

                }
                if (option.wrap)
                    item.addClass(option.callback ? 'app-wrap-text' : 'app-wrap');
                if (option.disabled)
                    item.addClass('ui-disabled');
                if (option.itemClassName)
                    item.addClass(option.itemClassName);
                if (option.linkClassName)
                    link.addClass(option.linkClassName);
                if (option.keepOpen) {
                    link.addClass('app-keep-open');
                    if (!option.animate)
                        link.addClass('app-btn-icon-transparent');
                }
                if (option.animate)
                    link.addClass('app-animated app-animation-spin');
                if (option.selected)
                    $(iconCheck).appendTo(link);
            });

        },
        tabs: function (method, options) {

            function create() {
                var tabs = options.tabs,
                    firstContentItem = options.placeholder || $(tabs[0].content[0]),
                    placeholder = $('<div class="app-tabs ui-header ui-bar-inherit"/>').insertBefore(firstContentItem).addClass(options.className),
                    navbar = $('<div class="ui-navbar"/>').appendTo(placeholder),
                    list = $('<ul/>').appendTo(navbar).addClass('ui-grid-' + String.fromCharCode(97 + tabs.length - 2)),
                    activeTab = tabs[0].text,
                    selectedTab;
                if (!options.id) {
                    options.id = firstContentItem.attr('id');
                    if (options.id)
                        options.id += '_tabs';
                }
                if (options.id) {
                    placeholder.attr('id', options.id);
                    activeTab = pageVariable(options.id) || activeTab;
                }
                $(tabs).each(function (index) {
                    var t = this,
                        link = $('<a class="ui-btn"/>').appendTo($('<li/>').addClass('ui-block-' + String.fromCharCode(97 + index)).appendTo(list)).text(t.text);
                    t.active = t.text == activeTab;
                    if (t.active)
                        link.addClass('ui-btn-active app-tab-active');
                });
                navbar.on('vclick', function (event) {
                    var link = $(event.target).closest('a'),
                        activeLink = navbar.find('.app-tab-active'),
                        scrollable = placeholder.parent(),
                        stub = scrollable.find('.app-stub,.app-stub-main'),
                        forceSelectedTab = arguments.length != 2 ? null : arguments[1].selectedTab,
                        text = selectedTab || forceSelectedTab || link.text(),
                        activePage = $mobile.activePage,
                        activeTab,
                        hiddenHeight = 0,
                        skip,
                        context;
                    if (forceSelectedTab)
                        selectedTab = forceSelectedTab;
                    if (link.length)
                        if (!selectedTab && link.is('.app-tab-more')) {
                            navbar.find('.ui-btn').removeClass('ui-btn-active');
                            callWithFeedback(link, function () {
                                link.addClass('ui-btn-active');
                                context = [];
                                $(options.tabs).each(function (index) {
                                    var t = this;
                                    context.push({
                                        text: t.text, icon: t.active ? 'check' : false, wrap: true, context: { text: t.text, index: index }, linkClassName: 'app-btn-icon-transparent', callback: function (selection) {
                                            link.removeClass('ui-btn-active');
                                            selectedTab = selection.text;
                                            $(navbar.find('.ui-btn')[selection.index]).trigger('vclick');
                                        }
                                    });
                                });
                                showListPopup({
                                    items: context, anchor: link,
                                    afterclose: function () {
                                        setTimeout(function () {
                                            link.removeClass('ui-btn-active');
                                            navbar.find('.app-tab-active').addClass('ui-btn-active');
                                        }, 50);

                                    }
                                });
                                /*
                                showContextPanel(context, '#app-panel-tabs', {
                                close: function () {
                                setTimeout(function () {
                                link.removeClass('ui-btn-active');
                                navbar.find('.app-tab-active').addClass('ui-btn-active');
                                }, 50);
                                },
                                position: 'right'
                                });*/
                            });
                        }
                        else {
                            navbar.find('.ui-btn').removeClass('app-tab-active ui-btn-active');
                            link.addClass('app-tab-active ui-btn-active');
                            $(tabs).each(function () {
                                var t = this;
                                if (t.active) {
                                    if (text == t.text)
                                        skip = true;
                                    $(t.content).each(function () {
                                        hiddenHeight += $(this).outerHeight(true);
                                    });
                                }
                                t.active = t.text == text;
                                if (t.active)
                                    activeTab = t;
                            });

                            if (skip) {
                                selectedTab = null;
                                return;
                            }

                            pageVariable(options.id, text);
                            if (hiddenHeight && stub.length && stub.offset().top + stub.outerHeight() - hiddenHeight < scrollable.offset().top + scrollable.height())
                                stub.height(hiddenHeight + stub.outerHeight());
                            saveScrolling(activePage);
                            update(placeholder);

                            if (selectedTab) {
                                selectedTab = null;
                                fit(placeholder);
                            }
                            if (activeTab.callback)
                                activeTab.callback();
                            if (options.change) {
                                touchScrolling = false;
                                options.change(activeTab);
                                restoreScrolling(activePage);
                            }
                            trimContentStub(scrollable, stub);
                        }
                    return false;
                });
                placeholder.data('data-tabs', options.tabs);
                update(placeholder);
                fit(placeholder, false);
            }

            function destroy(placeholder) {
                if (!placeholder)
                    placeholder = options.container ? options.container.find('.app-tabs') : $mobile.activePage.find('.app-wrapper .app-tabs');
                placeholder.data('data-tabs', null).remove();
            }

            function update(placeholder) {
                if (!placeholder)
                    placeholder = $mobile.activePage.find('.app-wrapper .app-tabs');
                $(placeholder).each(function () {
                    $($(this).data('data-tabs')).each(function () {
                        var t = this;
                        $(t.content).each(function () {
                            if (t.active)
                                $(this).removeClass('app-tab-hidden');
                            else
                                $(this).addClass('app-tab-hidden');
                        });
                    });
                });
            }

            function fit(placeholder, reset) {
                if (!placeholder)
                    placeholder = (options && options.page || $mobile.activePage).find('.app-tabs');
                $(placeholder).each(function () {
                    var that = $(this),
                        list = that.find('ul'),
                        btn,
                        items = list.find('li'),
                        buttons = list.find('.ui-btn'),
                        reduce = true,
                        hiddenWidth = 0, maxListWidth = 0,
                        firstIteration = true,
                        buttonIsActive;

                    function resetButtons(complete) {
                        list.attr('class', 'ui-grid-' + String.fromCharCode(97 + buttons.length - 2));
                        if (complete) {
                            items.width('').show();
                            list.css('max-width', '').width('');
                            buttons.removeClass('app-tab-active app-tab-more ui-btn-active ui-last-child'); //.attr('title', '');
                            $(that.removeClass('app-tabs-expanded').data('data-tabs')).each(function (index) {
                                var t = this,
                                    btn = $(buttons[index]).text(t.text);
                                if (t.active)
                                    btn.addClass('ui-btn-active app-tab-active');
                            });
                        }
                    }

                    resetButtons(reset != false);
                    while (buttons.length > 2 && reduce) {
                        reduce = false;
                        buttons.each(function () {
                            var b = this,
                                w;
                            if (b.scrollWidth > b.offsetWidth) {
                                reduce = true;
                                w = b.scrollWidth - b.offsetWidth + cssUnitsToNumber($(b).css('padding-right'));
                                hiddenWidth += w;
                            }
                        });
                        if (reduce) {
                            if (list.parent().width() - list.outerWidth() > hiddenWidth) {
                                that.addClass('app-tabs-expanded');
                                var widths = [];
                                buttons.each(function () {
                                    var b = this,
                                        $b = $(b),
                                        li = $b.parent();
                                    if (b.scrollWidth > b.offsetWidth)
                                        widths.push(b.scrollWidth + cssUnitsToNumber($b.css('padding-right')));
                                    else
                                        widths.push(li.width());
                                    maxListWidth += widths[widths.length - 1];
                                });
                                list.css('max-width', maxListWidth).width(maxListWidth);
                                buttons.each(function (index) {
                                    $(this).parent().width(widths[index]);
                                });
                                break;
                            }
                            if (firstIteration)
                                firstIteration = false;
                            else {
                                btn = $(buttons[buttons.length - 1]);
                                buttonIsActive = btn.is('.app-tab-active');
                                btn.parent().hide();
                                buttons = buttons.slice(0, buttons.length - 1);
                                resetButtons();
                            }
                            btn = $(buttons[buttons.length - 1]);
                            btn.text(resourcesMobile.More).addClass('app-tab-more ui-last-child'); //.attr('title', resourcesMobile.More);
                            if (buttonIsActive)
                                btn.addClass('ui-btn-active app-tab-active');
                        }
                        else {
                            break;
                        }
                    };
                });
            }

            switch (method) {
                case 'create':
                    if (options.tabs && options.tabs.length > 1)
                        create(options);
                    break;
                case 'destroy':
                    destroy();
                    break;
                case 'fit':
                    fit();
                    break;
            }
        },
        refreshMenuStrip: function () {
            var menuStripInfo = this._menuStrip,
                menuStrip = menuStripInfo && menuStripInfo.strip,
                title = this._title,
                x1 = title.offset().left + title.outerWidth(),
                leftMostButton = this._toolbar.find('.app-btn-cluster-right .ui-btn:visible').first(),
                x2 = (leftMostButton.length ? leftMostButton.offset().left : this._toolbar.outerWidth()) - 10,
                rootNodes,
                list,
                itemLinks, moreLink, moreWidth,
                stripWidth,
                item, itemLeft, itemWidth;
            if (!menuStrip) {
                menuStripInfo = this._menuStrip = { strip: $('<div class="app-menu-strip"/>').appendTo(this.toolbar()) }
                menuStrip = menuStripInfo.strip;
                list = $('<ul/>');
                for (var prop in Web.Menu.Nodes) {
                    rootNodes = Web.Menu.Nodes[prop];
                    break;
                }
                for (var i = 0; i < rootNodes.length; i++) {
                    var n = rootNodes[i],
                        item = $('<li/>').appendTo(list),
                        link = $('<a class="ui-btn"/>').appendTo(item).text(n.title).attr({ title: n.description }).data('data-node', n);
                    if (n.children)
                        link.addClass('app-has-children');
                    if (n.selected)
                        link.addClass('app-selected');

                }

                menuStripInfo.links = list.find('.ui-btn');
                menuStripInfo.items = menuStripInfo.links.parent();
                menuStripInfo.more = $('<a class="ui-btn app-has-children"/>').appendTo($('<li/>').appendTo(list)).text(resourcesMobile.More);

                function clickNode(node) {
                    if (node.url)
                        if (node.target)
                            _window.open(node.url, node.target);
                        else
                            _window.location.href = node.url;

                }

                list.appendTo(menuStrip).on('vclick', function (event) {
                    var link = $(event.target).closest('.ui-btn'),
                        linkIsSelected = link.is('.app-selected'),
                        node = link.data('data-node'),
                        isExternalTarget = node && node.url && !node.children;
                    if (link.length == 0)
                        return false;
                    if (isExternalTarget)
                        busyBeforeUnload();
                    callWithFeedback(link, function () {
                        if (isExternalTarget)
                            clickNode(node);
                        else {
                            if (!linkIsSelected)
                                link.addClass('app-selected');
                            var popup = $('<div class="app-popup app-popup-listview app-popup-menu" data-theme="a"/>'),
                                inner = $('<div class="ui-panel-inner"/>').appendTo($('<div class="ui-content"/>').appendTo(popup)),
                                listview = $('<ul class="app-listview"/>').appendTo(inner),
                                closing, selectedNode, selectedLink,
                                selectedItem,
                                depth = 1;
                            function enumNodes(node, depth) {
                                if (node.title) {
                                    var li = $('<li data-icon="false"/>').addClass('app-depth' + depth).appendTo(listview),
                                        link = $('<a/>').appendTo(li).text(node.title).attr('title', node.description).data('data-context', node);
                                    if (node.selected)
                                        selectedLink = link;
                                }
                                $(node.children).each(function () {
                                    enumNodes(this, depth + 1);
                                });
                            }
                            if (!node) {
                                depth = 0;
                                node = { children: [] }
                                menuStrip.find('li:hidden a').each(function () {
                                    node.children.push($(this).data('data-node'));
                                });
                            }

                            enumNodes(node, depth);
                            if (selectedLink)
                                selectedLink.addClass('app-selected app-btn-icon-transparent').parent().attr('data-icon', 'check');
                            listview.listview().on('vclick', function (event) {
                                var link = $(event.target).closest('.ui-btn');
                                if (clickable(link))
                                    mobile.callWithFeedback(link, function () {
                                        selectedNode = link.data('data-context');
                                        closePopup(popup);
                                    });
                                return false;
                            });
                            popup.popup({
                                history: !isDesktop(),
                                transition: 'fade',
                                tolerance: 3,
                                arrow: 't,l,r,b',
                                overlayTheme: 'b',
                                positionTo: link,
                                beforeposition: function () {
                                    var screenHeight = $mobile.getScreenHeight(),
                                        toolbarHeight = mobile.toolbar().outerHeight(),
                                        height = popup.outerHeight(true),
                                        w;
                                    if (height >= screenHeight - toolbarHeight) {
                                        inner.css('height', screenHeight - toolbarHeight * 2.25);
                                        if (isDesktop()) {
                                            w = inner.width() + 20;
                                            inner.css({ width: w });
                                            popup.css({ minWidth: w, maxWidth: 'auto' });
                                        }
                                    }
                                },
                                afteropen: function () {
                                    popupIsOpened(null, popup);
                                    if (isDesktop())
                                        inner.focus();
                                },
                                afterclose: function () {
                                    if (!linkIsSelected)
                                        link.removeClass('app-selected');
                                    if (selectedNode && selectedNode.url)
                                        busyBeforeUnload();
                                    setTimeout(function () {
                                        destroyListView(listview);
                                        destroyPopup(popup);
                                        inner.off();
                                        if (selectedNode)
                                            clickNode(selectedNode);
                                    }, 100);
                                }
                            });
                            registerPanelScroller(popup);

                            configurePopupListview(popup);
                            popup.popup('open'/*, { x: link.offset().left + link.outerWidth() / 2, y: link.offset().top + link.outerHeight(true) * 3 / 4 }*/)
                              .closest('.ui-popup-container').css('marginTop', cssUnitsToNumber(link.css('fontSize')) * 2 / 3);
                            selectedItem = inner.find('.ui-btn.ui-icon-check').parent();
                            if (selectedItem.length && (selectedItem.position().top + selectedItem.outerHeight() - 1 > inner.outerHeight()))
                                inner.scrollTop(selectedItem.position().top - (inner.outerHeight() - selectedItem.outerHeight()) / 2);
                        }
                    });
                    return false;
                });
            }
            stripWidth = x2 - x1;
            if (stripWidth != menuStrip.data('tested-width') || !menuStrip.is(':visible')) {
                menuStrip.data('tested-width', stripWidth)
                if (stripWidth >= 50 && menuStrip.attr('data-enabled') != 'false') {
                    updateMenuStripState(true);
                    menuStrip.width(stripWidth).css({ left: x1 });
                    itemLinks = menuStripInfo.items;
                    moreLink = menuStripInfo.more.removeClass('app-selected').parent();
                    moreLink.hide();
                    itemLinks.show();
                    for (i = itemLinks.length - 1; i >= 0; i--) {
                        item = $(itemLinks[i]);
                        itemWidth = item.outerWidth();
                        itemLeft = item.offset().left;
                        if (itemLeft + itemWidth - 1 >= x2) {
                            moreLink.show();
                            moreWidth = moreLink.outerWidth();
                            item.hide();
                        }
                        if (item.is(':hidden') && item.find('.app-selected').length)
                            menuStripInfo.more.addClass('app-selected');
                        if (!moreLink.is(':visible') || moreLink.offset().left + moreWidth - 1 < x2) {
                            if (i <= 1 && !item.is(':visible'))
                                updateMenuStripState(false);
                            break;
                        }
                        else {
                            item.hide();
                            if (item.find('.app-selected').length)
                                menuStripInfo.more.addClass('app-selected');
                        }
                        if (i <= 1) {
                            updateMenuStripState(false);
                            break;
                        }
                    }
                }
                else
                    updateMenuStripState(false);
            }
        },
        refreshSideBar: function (context, newContext) {
            var that = this,
                content = contextSidebar().find('.ui-panel-inner'),
                pageInfo = mobile.pageInfo(),
                dataView = pageInfo && pageInfo.dataView,
                parentDataView = dataView && dataView.get_parentDataView(dataView),
                path = [],
                about = $('.TaskBox.About .Inner .Value'),
                showSummary = parentDataView && !parentDataView._parentDataViewId,
                requiresViewStyleSelector = dataView && dataView.get_isGrid(),
                extension = dataView && dataView.extension(),
                viewStyle = requiresViewStyleSelector && extension.viewStyle(),
                isGrid = viewStyle == 'Grid',
                isList = viewStyle == 'Cards' || viewStyle == 'List',
                isMap = viewStyle == 'Map',
                sidebarEventOptions = { items: newContext };

            function createViewStyleSelector() {
                requiresViewStyleSelector = false;
                addSeparator(newContext);
                newContext.push({
                    text: resourcesMobile.Grid, icon: 'grid', selected: isGrid, callback: function () {
                        if (!isGrid)
                            extension.viewStyle('Grid');
                    }
                });
                newContext.push({
                    text: resourcesMobile.Cards, icon: 'bullets', selected: isList, callback: function () {
                        if (!isList)
                            extension.viewStyle('Cards');
                    }
                });
                if (extension.tagged('supports-view-style-map'))
                    newContext.push({
                        text: resourcesMobile.Map, icon: 'location', selected: isMap, callback: function () {
                            if (!isMap)
                                extension.viewStyle('Map');
                        }
                    });
                addSeparator(newContext);
            }

            if (showSummary) {
                dataView = parentDataView;
                while (dataView) {
                    if (dataView.get_showInSummary() && !dataView.get_isInserting() && dataView.extension().commandRow())
                        path.unshift(dataView);
                    dataView = $app.find(dataView._filterSource);
                }
                $(path).each(function () {
                    mobile.enumerateFields(this, newContext);
                });
                if (newContext.length) {
                    dataView = path[path.length - 1];
                    newContext.push({
                        text: dataView.get_view().Label, icon: 'info', callback: function () {
                            mobile.infoView(dataView, true);
                        }
                    });
                    newContext.push({});
                }
            }
            $(context).each(function () {
                var option = this;
                if (['back', 'check', 'info'].indexOf(option.icon) == -1 && (!option.system || option.toolbar != false) && (option.icon != 'eye' || parentDataView && !parentDataView.get_showInSummary())) {
                    if (option.text || newContext.length) {
                        if (option.navigateTo && requiresViewStyleSelector)
                            createViewStyleSelector();
                        option.theme = null;
                        newContext.push(option);
                    }
                }
            });
            if (requiresViewStyleSelector)
                createViewStyleSelector();
            else if (about.length && showSummary != false)
                newContext.push({ text: about.html(), isStatic: true, wrap: true });



        },
        contextPageInfo: function () {
            return mobile.pageInfo(this._contextScope);
        },
        refreshContext: function () {
            refreshContextSidebar();
        },
        contextScope: function (value) {
            if (arguments.length == 0)
                return this._contextScope;
            else
                this._contextScope = value;
        },
        contextDataView: function () {
            return this.contextPageInfo().dataView;
        },
        showContextMenu: function (options) {
            var id = '#app-panel-context';
            if (options) {
                this.contextScope(options.scope);
                if (options.scope) {
                    id += '-scope';
                    options.position = 'left';
                }
            }
            getContextPanel(id, function () {
                mobile.refreshContextMenu(id);
            }, options).panel('toggle');
        },
        refreshContextMenu: function (selector, context) {
            var that = this,
                panel = $(selector),
                listview = panel.find('ul'),
                listviewHeight = listview.outerHeight(),
                listviewStub, panelCover,
                isSideBar = panel.is('.app-sidebar'),
                contextMenuEvent;

            if (isSideBar && !panel.is(':visible')) {
                context = [];
                that.navContext(context);
                that.refreshAppButtons(context);
                return;
            }

            if (isSideBar)
                panelCover = $('<div></div>').appendTo($body).css({ 'z-index': 2000, 'position': 'absolute', left: 0, top: panel.css('top'), width: panel.outerWidth(), height: $window.height(), 'background-color': '#fff' });

            if (listviewHeight)
                listviewStub = $('<div></div>').height(listviewHeight).insertAfter(listview);
            clearListView(listview);
            listview.find('a').data('context-action', null);
            listview.find('li').remove();

            if (!context) {
                context = [];
                context.isSideBar = isSideBar;
                that.navContext(context);
            }


            if (isSideBar) {
                that.refreshAppButtons(context);
                var newContext = [];
                this.refreshSideBar(context, newContext);
                context = newContext;
                //newContext = [];
                //$mobile.activePage.find('.app-echo').each(function () {
                //    var echo = $(this),
                //        pageInfo = mobile.pageInfo(echo.attr('data-for'));
                //    newContext.push({
                //        text: echo.find('.app-echo-toolbar h3').text(), callback: function () {
                //        }
                //    });
                //});
                //if (newContext.length > 1)
                //    context = context.concat(newContext);
            }

            contextMenuEvent = $.Event(isSideBar ? 'sidebar.app' : 'contextmenu.app');
            contextMenuEvent.context = context;
            contextMenuEvent.panel = panel;
            $(document).trigger(contextMenuEvent);


            // update context listview
            while (context.length && !context[context.length - 1].text && !context[context.length - 1].src)
                context.splice(context.length - 1);
            if (!context.length && !isSideBar)
                context.push({ text: resourcesMobile.EmptyContext });

            this.renderContext(listview, context);


            listview.listview('refresh');

            if (isSideBar)
                listview.find('a.ui-btn-icon-right').removeClass('ui-btn-icon-right').addClass('ui-btn-icon-left');
            listview.find('li.app-wrap').addClass('ui-li-static ui-body-a').find('a').attr({ 'class': ''/*, 'rel': 'external'*/ });

            if (panel.is('.app-reset-scrolling'))
                panel.find('.ui-panel-inner').scrollTop(0);
            else
                restorePanelScrollTop(panel);

            if (listviewStub)
                listviewStub.remove();
            if (panelCover)
                panelCover.remove();
        },
        masterDetailStatus: function (pageId) {
            var pageInfo = this.pageInfo(pageId),
                dataView;
            if (pageInfo == null) {
                return;
            }
            dataView = pageInfo.dataView;
            if (dataView) {
                if (dataView._filterSource) {
                    var masterDataView = $app.find(dataView._filterSource);
                    if (masterDataView) {
                        var masterExtension = masterDataView.extension(),
                            map = masterExtension.itemMap(),
                            allFields = masterDataView._allFields,
                            row = masterExtension.commandRow(),
                            headingField;
                        if (map && row) {
                            headingField = allFields[map.heading]
                            v = row[headingField.Index];
                            v = headingField.text(v);
                            this._masterHeading = v;
                        }
                    }
                }
            }
        },
        focus: function (fieldName, message) {
            var that = this,
                activePage = $mobile.activePage,
                fieldInput = activePage.find('.app-field-' + fieldName),
                item, itemOffsetTop,
                screen, scrollTop,
                popup = $('.app-popup-message'),
                tabs = activePage.find('.app-tabs-form');
            if (popup.length)
                return;
            if (fieldInput.length) {
                item = fieldInput.closest('li');
                if (fieldInput.attr('type') == 'hidden')
                    fieldInput = item.find('input[type="text"]');
                if (tabs.length) {
                    var dataView = mobile.dataView(),
                        field = dataView.findField(fieldName);
                    $(dataView._categories).each(function () {
                        var category = this;
                        if (category.Index == field.CategoryIndex) {
                            tabs.find('.ui-btn').each(function () {
                                var tabLink = $(this);
                                if (category.Tab == tabLink.text()) {
                                    if (!tabLink.is('.ui-btn-active'))
                                        tabLink.trigger('vclick');
                                    return false;
                                }

                            });
                            return false;
                        }
                    });
                }
                fieldInput.closest('.ui-collapsible').find('.ui-collapsible-heading-collapsed .ui-btn').trigger('vclick', false);
                screen = that.screen();
                itemOffsetTop = item.offset().top;
                if (itemOffsetTop < screen.top || itemOffsetTop + item.outerHeight() > screen.bottom - (tabs.length ? tabs.outerHeight() : 0)) {
                    scrollTop = itemOffsetTop - (screen.height - item.outerHeight()) / 2;
                    $window.scrollTop(scrollTop > 0 ? scrollTop : 0);
                }
                popup = $('<div class="ui-content app-popup-message"/>').html(message).popup({
                    history: false,
                    arrow: 't,b',
                    overlayTheme: 'b',
                    positionTo: fieldInput,
                    afteropen: function () {
                    },
                    afterclose: function () {
                        destroyPopup(popup);
                        fieldInput.focus();
                    }
                }).popup('open'/*, { x: fieldInput.offset().left + fieldInput.outerWidth() / 2, y: fieldInput.offset().top + fieldInput.outerHeight() + 8 }*/).on('vclick', function () {
                    closePopup(popup);
                    return false;
                });
            }
        },
        showLookup: function (context) {
            var pageInfo = this.pageInfo(),
                dataView = pageInfo.dataView,
                lookupField = context.field,
                lookupFieldDataView = lookupField._dataView,
                contextFilter = lookupFieldDataView.get_contextFilter(lookupField, lookupFieldDataView.extension().collect()),
                id,
                lookupDataView, lookupPageInfo,
                query = context.query,
                pageHeaderText = context.aliasField.HeaderText;
            this.modalDataView();
            id = context.field.ItemsDataController.toLowerCase();
            if ($find(id))
                id += Sys.Application.getComponents().length;
            if (query)
                pageVariable(id + '_' + (pageVariable(id + '_viewId') || lookupField.ItemsDataView || 'grid1') + '_filter', [String.format('_quickfind_:~%js%{0}', Sys.Serialization.JavaScriptSerializer.serialize(query))]);
            lookupDataView = $create(Web.DataView, {
                id: id, baseUrl: dataView.get_baseUrl(), servicePath: dataView.get_servicePath(),
                controller: lookupField.ItemsDataController, viewId: lookupField.ItemsDataView,
                externalFilter: lookupFieldDataView.get_contextFilter(lookupField, contextFilter),
                externalFilter: contextFilter,
                filterSource: contextFilter.length > 0 ? 'Context' : null,
                showSearchBar: true,
                showFirstLetters: lookupField.ItemsLetters,
                searchOnStart: lookupField.SearchOnStart,
                description: lookupField.ItemsDescription
            }, null, null, $('<div>').hide().appendTo($body).attr('id', id + 'Placeholder')[0]);
            lookupPageInfo = this.pageInfo(lookupDataView._id);
            if (query)
                lookupDataView.viewProp('quickFind', query);
            lookupPageInfo.headerText = context.value ? [context.text, pageHeaderText] : pageHeaderText;
            lookupPageInfo.resolved = true;
            lookupDataView._lookupInfo = context;
            if (context.value != null && !lookupField.ItemsValueSyncDisabled) {
                lookupDataView._syncKey = [context.value];
                lookupDataView._selectedKey = [context.value];
            }
            lookupDataView._parentDataViewId = dataView._id;
            this.modalDataView(lookupPageInfo.id);
        },
        pageInit: function (id, indicateProgress) {
            var pageInfo = this.pageInfo(id);
            if (pageInfo == null) return false;
            var dataView = pageInfo.dataView,
                initialized = pageInfo.initialized || (!pageInfo.dataView && pageInfo.initialized != false);
            if (dataView && dataView._busy())
                return false;
            if (!pageInfo.initialized) {
                pageInfo.initialized = true;
                if (dataView) {
                    pageInfo.requiresInitCallback = true;
                    if (indicateProgress != false)
                        busyIndicator(true);
                    if (pageInfo.refreshed == false) {
                        pageInfo.refreshed = true;
                        dataView.extension().refresh();
                    }
                    else
                        dataView._loadPage();
                }
            }
            return initialized;
        },
        pageShow: function (id) {
            if (!$mobile.activePage)
                return;
            $mobile.activePage.find("[data-role='navbar'] a.app-tab-active").addClass("ui-btn-active");
            var pageInfo = this.pageInfo(id);
            if (pageInfo == null)
                return;

            var dataView = pageInfo.dataView,
                extension = dataView ? dataView.extension() : null,
                stackIndex = this._modalStack.indexOf(pageInfo);
            if (stackIndex >= 0)
                this._modalStack.splice(stackIndex, 1);
            if (!pageInfo.initialized) {
                pageInfo.initialized = true;
                if (dataView)
                    dataView._loadPage();
            }
            if (extension && extension._reset)
                extension.refresh();
        },
        screen: function () {
            var scrollTop = $mobile.window.scrollTop(),
                toolbarHeight = this.toolbar().outerHeight(),
                screenHeight = $mobile.getScreenHeight();
            return { top: scrollTop + toolbarHeight, bottom: scrollTop + $mobile.getScreenHeight(), height: screenHeight - toolbarHeight, width: $window.width() };

        },
        callWhenVisible: function (selector, func) {
            $mobile.activePage.find(selector).each(function () {
                var elem = $(this);
                var itemTop = elem.offset().top,
                    itemBottom = itemTop + elem.outerHeight(),
                    scroller = elem.closest('.app-wrapper'),
                    scrollerTop = scroller.offset().top,
                    scrollerBottom = scrollerTop + scroller.height() - 1;
                if (scrollerTop <= itemTop && itemTop <= scrollerBottom || scrollerTop <= itemBottom && itemBottom <= scrollerBottom || itemTop <= scrollerTop && scrollerBottom <= itemBottom)
                    func(elem);
            });
        },
        asyncJob: function () {
            return this._asyncJob;
        },
        nextAsycJob: function () {
            return ++this._asyncJob;
        },
        supports: function (feature) {
            switch (feature) {
                case 'Map':
                    return this._supportsMap == true;
            }
            return false;
        },
        registerAPI: function (name) {
            var that = this,
                url = 'https://maps.googleapis.com/maps/api/js?&v=3.exp&sensor=false&callback=appFactoryCallback';
            if (settings.mapApiIdentifier && !_window.location.host.match(/^localhost\b/))
                url += '&' + settings.mapApiIdentifier;
            if (name == 'Map' && !that._mapApiRegistered) {
                that._mapApiRegistered = true;
                _window.appFactoryCallback = function () {
                    _window.appFactoryCallback = null;
                    that._supportsMap = true;
                    $(document).trigger($.Event('appmapinit'));
                }
                $('<script type="text/javascript"/>').attr('src', url).appendTo($body);
            }
        },
        fetchOnDemand: function () {
            function triggerButtonClick(button) {
                button.trigger('vclick');
            }
            if (!touchScrolling) {
                this.callWhenVisible('.dv-load-at-bottom', triggerButtonClick);
                this.callWhenVisible('.dv-load-at-top', triggerButtonClick);
            }
            return this;
        },
        headingOnDemand: function (enable) {
            var that = this,
                heading = $mobile.activePage.find('.dv-heading'),
                selector = heading.attr('data-selector'),
                headingText = selector ? $mobile.activePage.find(selector) : heading.find('.app-static-text'),
                headingBar = that.headingBar(),
                appBarText,
                doHide = true,
                viewHeader, headerParent;
            if (!isInTransition && (headingText.length || selector))
                if (enable === false) {
                    viewHeader = headingBar.find('.app-grid-header');
                    if (viewHeader.length) {
                        if (!viewHeader.is('.app-disabled'))
                            headingBar.slideUp('fast', function () {
                                headerParent = viewHeader.parent();
                                viewHeader.detach();
                                headerParent.empty();
                                viewHeader.appendTo(headerParent);
                                headingBar.slideDown('fast');
                                viewHeader.addClass('app-disabled');
                                // clear the text from the original heading
                                viewHeader = heading.find('.app-grid-header').detach();
                                heading.empty();
                                viewHeader.appendTo(heading);

                            });
                    }
                    else {
                        heading.addClass('app-disabled');
                        headingBar.slideUp('fast');
                    }
                    doHide = false;
                }
                else {
                    if (!heading.is('.app-disabled') && !_focusedInput) {
                        var screen = that.screen(),
                            headingTop = Math.ceil(headingText.length ? headingText.offset().top + (selector ? 1 : 0) : -1),
                            yardstickClass,
                            fixedTabs = $mobile.activePage.find('> .ui-content > .app-tabs');
                        if (headingTop < screen.top && (selector || headingText.height() > 0))
                            if (headingBar.is(':visible'))
                                doHide = false;
                            else {
                                appBarText = headingBar.css('top', (that.toolbar().outerHeight() + (fixedTabs.length ? fixedTabs.outerHeight() : 0) - 1) + 'px').find('span.app-bar-text');
                                if (selector) {
                                    appBarText.html(heading.html()).css('white-space', 'normal');
                                    yardstickClass = heading.prev().find('.app-yardstick').attr('data-yardstick-class');
                                    if (yardstickClass)
                                        appBarText.find('.app-grid-header').attr('class', 'app-grid-header ' + yardstickClass);
                                }
                                else
                                    appBarText.text(headingText.text()).css('white-space', '');
                                headingBar.find('span.app-bar-label').text(headingText.closest('li').find('label:first').text());
                                doHide = false;
                                headingBar.show();
                            }
                    }
                }
            if (doHide)
                headingBar.hide();
            return that;
        },
        wait: function (enable) {
        },
        start: function (options) {
            if (!options && !(this._appLoaded && this._pageCreated)) return;

            $mobile.ignoreContentEnabled = true;
            var pageMenu = mobile.pageMenu(options && options.pageId),
                linkCount = 0,
                firstUserPage,
                pageTemplate = $(options && options.selector || '#PageContent'),
                dataUrl = pageTemplate.attr('data-href'),
                userPages = pageTemplate.find('div[data-app-role="page"]').each(function (index) {
                    var userPage = $(this),
                        framework = userPage.attr('data-content-framework');
                    if (framework)
                        userPage.attr('data-enhance', 'false');
                    userPage = $(this).attr({ 'data-role': 'page', 'data-app-role': null }).addClass('app-page-scrollable').appendTo($body);
                    var pageHeader = userPage.attr('data-page-header'),
                        activator = parseActivator(userPage),
                        pageInfo = { text: (pageHeader != 'false' ? pageHeader : '') || activator.text || mobile.title(), description: activator.description, activator: activator, url: dataUrl, transition: options && options.transition },
                        pageId = userPage.attr('id') || (pathToId(dataUrl || location.pathname) + (index > 0 || dataUrl ? (index + 1) : '')),
                        pageButton,
                        pageContent;
                    pageInfo.headerText = pageInfo.text;
                    userPage.find('div[data-role="content"]').contents().wrapAll('<div class="app-page-content' + (framework ? ' app-content-framework app-' + framework : '') + '"/>');
                    userPage.page();
                    userPage.attr('id', pageId);
                    pageInfo.id = pageId;
                    mobile.pageInfo(pageInfo);
                    pageContent = createScroller(userPage, false).find('.app-page-content');
                    if (framework) {
                        userPage.attr('data-page-header', 'false')
                        $app.configureFramework(framework, pageContent, function (config) {
                            contentFramework = config;
                        });
                    }
                    pageContent.find('.carousel').on('swipeleft swiperight', function (event) {
                        $(event.target).closest('.carousel').find((event.type == 'swipeleft' ? '.right' : '.left') + '.carousel-control').trigger('click');
                    });
                    if (activator.text) {
                        linkCount++;
                        pageButton = $('<a class="app-action-navigate" />')
                            .attr('href', '#' + pageId).text(activator.text)
                            .appendTo($('<li/>').appendTo(pageMenu));
                        if (pageInfo.description)
                            $('<p/>').appendTo(pageButton).text(pageInfo.description);
                    }
                    resetInvisiblePageHeight(userPage);
                });
            if (userPages.length) {
                firstUserPage = userPages.first();
                if (linkCount == 0 && firstUserPage.attr('data-activator') != 'false')
                    $('<a class="app-action-navigate" />')
                            .attr('href', '#' + firstUserPage.attr('id')).text(firstUserPage.attr('data-page-header') || resourcesMenu.SeeAlso)
                            .appendTo($('<li/>').appendTo(pageMenu));

                if (pageMenu.is('.ui-listview'))
                    pageMenu.listview().listview('refresh');
            }
            // locate current node
            var mainMenuId,
                rootNodes,
                currentNode;
            for (var prop in Web.Menu.Nodes) {
                rootNodes = Web.Menu.Nodes[prop];
                break;
            }
            function findCurrentNode(nodes) {
                $(nodes).each(function () {
                    if (this.url && this.url.toLowerCase() == location.pathname.toLowerCase()) {
                        currentNode = this;
                        return false;
                    }
                    if (this.children) {
                        findCurrentNode(this.children);
                        if (currentNode) {
                            this.selected = true;
                            return false;
                        }
                    }
                });
                return null;
            }
            if (!options)
                findCurrentNode(rootNodes);
            // create  a table of contents if there is no "custom" pages
            if (currentNode && !userPages.length && pageMenu.find('a').length == 0)
                $(currentNode.children).each(function () {
                    $('<a rel="external"/>').attr('href', this.url).appendTo($('<li/>').appendTo(pageMenu)).text(this.title);
                });

            var that = this,
                activePage = options ? mobile.page(options.pageId) : $mobile.activePage,
                links = activePage.find('a.app-action-navigate'),
                anchor = location.href.match(/#(.+)$/),
                pageMenu,
                scrollable,
                tabs = [], tabbedContainer,
                firstPage = this._pages[0];

            function appStart() {
                var startupScript = options && $(options.selector).data('scripts');
                if (startupScript)
                    eval(startupScript);
                $(document).trigger($.Event('start.app'));
                setInterval(function () {
                    if (calculateCausedBy.length && !calculateLastCausedBy) {
                        calculateLastCausedBy = calculateCausedBy[0];
                        $(document).trigger($.Event('calculate.app'), calculateLastCausedBy);

                    }
                }, 300);
            }

            function createTabStrip() {
                mobile.tabs('create', {
                    tabs: tabs, className: 'app-tabs-echo', change: function () {
                        fetchEchos();
                    }
                });
            }

            if (links.length == 1 && (settings.initialListMode == 'SeeAll' || (!firstPage.dataView || firstPage.dataView.get_lastCommandName() || _window.location.href.match(/_controller=.+_commandName=.+/))))
                $(this._pages).each(function () {
                    var pageInfo = this,
                        dataView = pageInfo.dataView;
                    rootDataViewId = dataView && dataView._id;
                    if ((!dataUrl || pageInfo.url == dataUrl && !pageInfo.root) && (!dataView || !dataView._hidden)) {

                        if (!dataUrl) {
                            pageInfo.home = true;
                            dataUrl = $mobile.path.documentBase.pathname;
                            //window.location.replace('#' + pageInfo.id);
                            //$mobile.navigate.navigator.squash(dataUrl);
                        }

                        appStart();

                        $mobile.navigate.history.clearForward();

                        if (dataUrl)
                            pageInfo.replaceUrl = dataUrl;
                        that.changePage(pageInfo.id);
                        return false;
                    }
                });
            else if (activePage.attr('id') == 'Main') {

                //if (location.hash && location.hash.length > 1) {
                //    window.location.replace('#');
                //    history.replaceState('', document.title, window.location.pathname);
                //}

                if (links.length)
                    activePage.find('a[rel="external"]').parent().remove();

                links.show();
                createScroller(activePage);
                activePage.addClass('app-page-scrollable');
                pageHeaderText(document.title);
                scrollable = activePage.find('.app-wrapper');

                $(links).each(function () {
                    var link = $(this),
                        id = link.attr('href'),
                        pageInfo = id && mobile.pageInfo(id.substring(1)),
                        t, echo,
                        activator;
                    if (pageInfo && pageInfo.dataView) {
                        activator = pageInfo.activator;
                        if (activator && activator.type == 'Tab') {
                            $(tabs).each(function () {
                                if (this.text == activator.text) {
                                    t = this;
                                    return false;
                                }
                            });
                            if (!t) {
                                if (tabbedContainer != activator.container) {
                                    if (tabbedContainer) {
                                        createTabStrip();
                                        tabs = [];
                                    }
                                    tabbedContainer = activator.container;
                                }

                                t = { text: activator.text, content: [] };
                                tabs.push(t);
                            }
                        }
                        echo = createEcho(pageInfo.id, scrollable);
                        if (t)
                            t.content.push(echo);
                        link.parent().remove();
                    }
                });
                if (tabbedContainer)
                    createTabStrip();
                pageMenu = mobile.pageMenu();
                if (pageMenu.find('a.app-action-navigate,a[rel="external"]').length)
                    pageMenu.listview().show();
                else
                    pageMenu.remove();
                resetPageHeight();
                if (scrollable.find('.app-tabs').length > 1)
                    $('<div class="app-stub-main"/>').appendTo(scrollable);
                appStart();
                fetchEchos();
                mobile.content().focus();
                updateMenuButtonStatus();
            }
            if (!options)
                setTimeout(function () {
                    _webkitPreventMainReload = false;
                }, 500);
        },
        pageMenu: function (pageId) {
            var that = this,
                content = this.content(pageId),
                menu = content.find('ul.app-page-menu');
            if (!menu.length) {
                //var pageDesc = $('<p class="app-page-menu-desc"/>').appendTo(content).hide();
                menu = $('<ul data-role="listview" data-inset="false" class="app-page-menu"/>').appendTo(content).hide().on('vclick', function (event) {
                    var link = $(event.target),
                        href,
                        hrefIsPageId;
                    if (!link.is('a'))
                        link = link.closest('a');
                    if (link.length) {
                        href = link.attr('href');
                        hrefIsPageId = href.match(/^#/);
                        if (!hrefIsPageId)
                            busyBeforeUnload();
                        callWithFeedback(link, function () {
                            if (hrefIsPageId)
                                that.changePage(href.substring(1));
                            else {
                                activeLink(link, false);
                                _window.location.href = href;
                            }
                        });
                    }
                    return false;
                });
                //if (about.length) {
                //    $('<p>').appendTo(pageDesc.html(about.html()));
                //    pageDesc.find('a').attr('rel', 'external');
                //}
                //$('<p>').appendTo(content);
            }
            return menu;
        },
        initialize: function () {

            var that = this,
                pulse = timeNow(),
                startUrl = $mobile.path.parseUrl(location.href),
                startHash = startUrl && startUrl.hash,
                firstPage,
                head = $('head');

            initTouchUI();

            if (startHash && (startHash.match(/\W/) || !$(startHash).length)) {
                //location.replace(startUrl.hrefNoHash);
                $mobile.navigate.history.initialDst = '';
                firstPage = $mobile.navigate.history.stack[0];
                firstPage.url = startUrl.hrefNoHash;
                firstPage.hash = '';
            }

            if (iOS)
                $('<meta name="apple-mobile-web-app-capable" content="yes"/>' +
                  '<meta name="apple-mobile-web-app-status-bar-style" content="black' + (iOSMajorVersion >= 8 ? '-translucent' : '') + '"/>' +
                  '<link rel="apple-touch-icon" href="../touch/logo-icon.png"/>').appendTo(head);
            else if (android)
                $('<meta name="mobile-web-app-capable" content="yes"/>' +
                  '<link rel="icon" sizes="196x196" href="../touch/logo-icon.png"/>').appendTo(head);


            function appPulse() {
                var newPulse = timeNow();
                if (newPulse - pulse > 2500) {
                    var event = $.Event('awake.app');
                    $(document).trigger(event);
                    if (event.isDefaultPrevented())
                        return;
                    else
                        newPulse = timeNow();
                }

                pulse = newPulse;
                setTimeout(appPulse, 1250);
            };
            setTimeout(appPulse, 10);
            if (!__settings.appInfo.match(/\|$/))
                $('#app-welcome').remove();

            $(document).on('change', ':input', function (event) {
                var target = $(event.target),
                    lastValue = target.attr('data-passive-value');
                if (lastValue == null || lastValue != target.val())
                    ensureCausesCalculate(target);
                if (lastValue != null)
                    target.attr('data-passive-value', null);
            }).on('keydown', ':input', function (event) {
                var target = $(event.target),
                    causesCalculate = target.attr('data-causes-calculate');
                if (causesCalculate) {
                    if (passiveCalculateOldValue == null)
                        passiveCalculateOldValue = target.val();
                    clearPassiveCalculateTimeout();
                    passiveCalculateTimeout = setTimeout(function () {
                        if (passiveCalculateOldValue != target.val()) {
                            target.attr('data-passive-value', target.val());
                            ensureCausesCalculate(target);
                        }
                        clearPassiveCalculateTimeout(true);
                    }, 4000);
                }
            }).on('focus', ':input', function (event) {
                var target = $(event.target),
                    parent = target.parent(),
                    format = target.data('format');

                if (target.is('#app-input-search'))
                    return;
                _focusedInput = target;
                activeLink();

                if (target.is('.app-lookup-input'))
                    target.next().addClass('ui-focus');
                hideHeadingBar();
                if (format) {
                    var v = target.val();
                    if (v) {
                        if (format.type == 'number') {
                            target.val(format.value);
                            var len = target.val().length;
                            target.get(0).setSelectionRange(len, len);
                        }
                    }
                    if (iOS)
                        setTimeout(function () {
                            target.attr('type', format.type);
                        }, 200);
                    else
                        target.attr('type', format.type);
                }
                if (!isDesktop()) {
                    clearTimeout(fixedPositionTimeout);
                    mobile.toolbar().css('position', 'absolute');
                    //$mobile.activePage.find('.ui-header-fixed').css('position', 'absolute');
                    $('.app-sidebar').css('position', 'absolute');
                }
            }).on('blur', ':input', function (event) {
                var link, linkText, query,
                    target = $(event.target),
                    format = target.data('format');

                clearPassiveCalculateTimeout(true);

                if (!_focusedInput)
                    return;

                if (_focusedInput.is('.app-lookup-input')) {
                    linkText = _focusedInput.data('link-text');
                    link = _focusedInput.data('link-text', null).next().removeClass('ui-focus');
                    if (linkText) {
                        link.toggleClass('ui-icon-carat-r ui-icon-search').removeClass('app-transparent');
                        setTimeout(function () {
                            if (link.data('link-text'))
                                link.text(linkText);
                        }, 2500);
                    }
                    query = _focusedInput.val().trim();
                    if (query)
                        link.text(query).data('data-context').query = query;
                    _focusedInput.val('');
                }
                _focusedInput = null;
                if (format) {
                    format.value = target.val();
                    format.value = format.value ? parseFloat(format.value) : null;
                    format.text = format.value == null ? '' : format.field.text(format.value, false);
                    target.attr('type', 'text').val(format.text);
                }

                if (!isDesktop())
                    fixedPositionTimeout = setTimeout(function () {
                        if (!_focusedInput) {
                            mobile.toolbar().css('position', '');
                            $('.app-sidebar').css('position', '');

                            //$mobile.activePage.find('.ui-header-fixed').css('position', '');
                            //if (iOS)
                            //    $window.scrollTop(0);
                        }
                    }, 1000);
            }).on('touchstart', 'a.app-lookup', function (event) {
                if (_focusedInput) {
                    var query = _focusedInput.val().trim();
                    if (query)
                        _focusedInput.next().text(query).removeClass('app-transparent');
                }
            }).on('touchend', 'a.app-lookup', function () {
                blurFocusedInput();
            }).on('keydown', function (event) {
                var which = event.which;
                if (which == 13 && !$(event.target).is('textarea')) {
                    if (_focusedInput) {
                        if (_focusedInput.is('.app-lookup-input')) {
                            var s = _focusedInput.val().trim();
                            if (s.length || isDesktopClient) {
                                _focusedInput.next().data('data-context').query = s;
                                _focusedInput.next().trigger('vclick');
                            }
                        }
                        else if (advancedSearchPageIsActive()) {
                            setTimeout(function () {
                                if (_focusedInput)
                                    _focusedInput.blur();
                                performAdvancedSearch(true);
                            }, 200);
                        }
                        else
                            setTimeout(function () {
                                if (_focusedInput)
                                    _focusedInput.blur();
                            }, 200);
                        return false;
                    }
                    else if (advancedSearchPageIsActive()) {
                        var popup = $('.ui-popup-active');
                        if (popup.length) {
                            if (!popup.find('.ui-listview .ui-btn').length)
                                $('.ui-popup-active .ui-popup').popup('close');
                        }
                        else
                            performAdvancedSearch(true);
                    }
                }
                if (!_focusedInput)
                    if (which == 13 || which == 32 || which == 27) {
                        var popup = $('.ui-popup-active .app-popup');
                        if (popup.length) {
                            if (popup.is('.app-popup-alert')) {
                                popup.find('.ui-btn').trigger('vclick');
                                return false;
                            }
                            if (popup.is('.app-popup-confirm') && which != 32) {
                                popup.find(which == 13 ? '.app-btn-confirm' : '.ui-btn:not(.app-btn-confirm)').trigger('vclick');
                                return false;
                            }
                        }
                    }
            }).on('keyup', '.app-lookup-input', function (event) {
                var target = $(event.target),
                    link = target.next();
                if (!target.data('link-text'))
                    setTimeout(function () {
                        if (target.val() != '') {
                            target.data('link-text', link.text());
                            link.html('&nbsp;').toggleClass('ui-icon-carat-r ui-icon-search app-transparent');
                        }
                    }, 10);
            });
            //if ($('div[data-content-framework]').length) {
            //    that._menuButton.toggleClass('ui-icon-home ui-icon-bars');
            //    that._contextButton.hide();
            //}
        }
    };

    /* initialize mobile page */

    (function () {
        $.event.special.swipe.scrollSupressionThreshold = 100;

        var touchRegex = /\b_touch_(\w+)=(\w+)\b/g,
            touchParam = touchRegex.exec(location.href),
            touchProp, touchValuem, touchReset;

        var originalFocusPage = $mobile.focusPage;
        $mobile.focusPage = function (page) {
            originalFocusPage(page);
            resetPageHeight(page);
            restoreScrolling(page);
        }

        $mobile.resetActivePageHeight = function (height) {
            var page = $("." + $mobile.activePageClass)/*,
                pageHeight = page.height(),
                pageOuterHeight = page.outerHeight(true)*/;

            if (typeof height === 'number')
                height--;

            height = height || $mobile.getScreenHeight();
            height -= mobile.toolbar().outerHeight(true);

            page.css("min-height", height);
        };

        $body = $('body');
        if (isDesktopClient)
            $body.addClass('app-desktop');
        if (ie && navigator.maxTouchPoints > 0) {
            $body.addClass('app-ms-tablet').removeClass('app-desktop');
            iePointerType = 'touch';
        }

        $('form:first').hide();
        var toolbar = $('<div id="app-bar-tools" data-role="header" data-position="fixed" data-theme="a" class="app-bar-tools"/>"').appendTo($body),
            page = $('<div data-role="page" id="Main"/>').appendTo($body),
            appButtonMarkup = '<a href="#" class="ui-btn-right app-btn ui-btn ui-btn-icon-notext ui-shadow ui-corner-all"/>',
            actionButton = $('<a class="ui-btn ui-btn-a ui-btn-icon-notext app-btn-promo"/>').hide().appendTo($body).on('vclick', handleAppButtonClick);
        //<div class="ui-btn ui-btn-icon-notext ui-icon-edit ui-shadow" style="border-color: silver; border-radius: 1.5em; width: 3em; height: 3em; right: 2em; bottom: 1em; position: fixed; z-index: 2000; box-shadow: 0px 1px 2px !important; background-color: silver;"></div>
        // create page content
        $('<div data-role="content" class="app-content-main"/>"').appendTo(page)
        // tool bar configuration
        $('<a data-role="button" href="#" id="app-btn-menu" class="ui-btn ui-btn-icon-notext ui-shadow ui-corner-all ui-icon-bars app-animation-spin">Site Map</a>').appendTo(toolbar);
        var toolbarHeader = $('<h1 class="ui-title"/>').appendTo(toolbar),
            buttonsBar = $('<div class="app-btn-cluster-right"/>').appendTo(toolbar);
        toolbarHeader.on('vclick', function () {
            if (isInTransition || $('.app-popup-message').length)
                return;
            toolbarHeader.addClass('ui-btn-active');
            setTimeout(function () {
                toolbarHeader.removeClass('ui-btn-active');
                if (getActivePageId() == 'taskassistant')
                    history.go(-1);
                else
                    taskAssistant();
            }, 200);

        });
        // app button 1
        $(appButtonMarkup).appendTo(buttonsBar);
        // app button 2
        $(appButtonMarkup).appendTo(buttonsBar);
        // app button 3
        $(appButtonMarkup).appendTo(buttonsBar);
        // app button 4
        $(appButtonMarkup).appendTo(buttonsBar);
        // app button 5
        $(appButtonMarkup).appendTo(buttonsBar);


        // context button
        $('<a href="#" id="app-btn-context" data-icon="dots" data-iconpos="notext" data-role="button" class="ui-btn-right app-btn-context"/>').appendTo(buttonsBar).attr('title', resourcesMobile.More).hide();
        // filter bar

        var headingBar = $('<div id="app-bar-heading" class="app-bar-heading ui-overlay-shadow"><span class="app-bar-label"/><span class="app-bar-text"/></div>').appendTo($body).hide()
            .on('vclick', function (event) {
                if (!$(event.target).closest('.app-grid-header').length) {
                    headingOnDemand(false);
                    refreshContextSidebar();
                    return false;
                }
            });

        // quick find controls
        var quickFindButton = toolbar.find('.app-btn').data('icon', 'gear').on('vclick', handleAppButtonClick);
        toolbar.toolbar();

        //$('<div class="app-history-preview"/>').appendTo(body);

        var
            sidebar = $('<div id="app-sidebar" class="ui-panel ui-panel-fixed ui-body-a app-sidebar"><div class="ui-panel-inner"><ul/></div></div>').appendTo($body),
            sidebarList = sidebar.find('ul');

        sidebarList.listview()
             .on('vclick', function (event) {
                 if (panelIsBusy || !clickable(event.target))
                     return false;
                 blurFocusedInput();
                 var link = $(event.target).closest('a'),
                    action = link.data('context-action');
                 if (link.length)
                     if (action) {
                         if (!mobile.busy())
                             callWithFeedback(link, function () {
                                 executeContextAction(action);
                             });
                         return false;
                     }
                     else
                         activeLink(link, false);
             });
    })();

    var mobile = $app.touch = $app.mobile = new Web.Mobile();
    mobile.activeLinkBlacklist = '.ui-slider-handle';

    $body.on('pagebeforeload', function (event, ui) {
        event.preventDefault();
        setTimeout(function () {
            location.replace(ui.toPage);
        }, 200);
    }).on('pagecontainershow', function (event, ui) {
        transitionStatus(false);
        updateMenuButtonStatus();
        headingOnDemand();
        fetchOnDemand(100);
        setTimeout(function () {
            fetchEchos();
        }, 200);
        refreshContextSidebar();
        // transition has finished
        function executePageChangeCallback() {
            if (pageChangeCallback) {
                pageChangeCallback();
                pageChangeCallback = null;
                if (pageInfo && pageInfo.returnCallback) {
                    pageInfo.returnCallback();
                    pageInfo.returnCallback = null;
                }
            }
        }
        var pageInfo = mobile.pageInfo();
        if (pageInfo) {
            if (pageInfo.initCallback) {
                pageInfo.initCallback();
                pageInfo.initCallback = null;
            }
            else
                executePageChangeCallback();
        }
        else if (getActivePageId() == 'Main')
            executePageChangeCallback();
    }).on('pagecontainercreate', function (event) {
        if (!mobile._shown)
            setTimeout(function () {
                mobile.start();
                mobile._shown = true;
            }, 100);
    }).on('pagecontainerbeforeshow', function (event, ui) {
        var activePage = $mobile.activePage,
            pageInfo = mobile.pageInfo();
        mobile.toolbar(mobile.title());
        if ($body.is('.app-page-header-hidden'))
            pageHeaderText(false);
        else
            pageHeaderText(pageInfo && pageInfo.headerText || pageInfo && pageInfo.dataView && pageInfo.dataView.get_view().Label || document.title);
        mobile.pageShow(getActivePageId());
        mobile.unloadPage(ui.prevPage, activePage);
        userActivity();
        mobile.contextScope(null);
    }).on('pagecontainerbeforehide', function (event, ui) {
        // before transition begings
        isInTransition = true;
        //$('.ui-panel-open').panel('close', true);
        if (ui.nextPage) {
            var pageInfo = mobile.pageInfo(ui.nextPage.attr('id'));
            if (pageInfo)
                mobile.masterDetailStatus(pageInfo.id);
        }
    }).on('pagecontainerbeforetransition', function (e, ui) {
        mobile.promo(false);
        saveScrolling($mobile.activePage);

        //$('.app-history').removeClass('app-history');
        //$('.app-history-preview').hide();
        //if ($mobile.navigate.history.activeIndex == 1 && ui.options.reverse) {
        //    body.removeClass('app-has-history');
        //}
    }).on('pagecontainertransition', function (e, ui) {

        //var history = $mobile.navigate.history,
        //    stack = history.stack;
        //if (history.activeIndex > 1) {
        //    body.addClass('app-has-history');
        //    $('.app-history-preview').show();
        //    restoreScrolling($(stack[history.activeIndex - 1].hash).addClass('app-history'));
        //}
        if (settings) {
            transitionStatus(false);
            resetPageHeight();
            if (settings.pageTransition == 'none')
                restoreScrolling($mobile.activePage);
            if (isDesktopClient)
                $($mobile.activePage).find('.app-wrapper').focus();
        }
        //alert('transion has finished' + $mobile.activePage.find('.app-wrapper').css('min-height'));
    });

    function touchPoint(event) {
        var touch = event.originalEvent.clientY && event.originalEvent || event.originalEvent.touches[0] || event.originalEvent.changedTouches[0];
        return { x: touch.clientX, y: touch.clientY };
    }

    function pointerIsTouch(event) {
        if (event.type.match(/^(MS)?pointer/))
            return event.originalEvent.pointerType == 'touch';
        return true;
    }

    var lastTouchedLink, lastTouchedLinkTimeout, startTouch, movementTestIsRequired;

    function clearLastTouchedLink() {
        clearTimeout(lastTouchedLinkTimeout);
        if (lastTouchedLink) {
            lastTouchedLink.data('touch-start', null);
            lastTouchedLink = null;
        }
    }

    // document event handlers
    $(document).ready(function () {
        mobile.initialize();
    }).on('calculate.app', function (event, causedBy) {
        var causedBy = causedBy.split(/\./);
        if (causedBy[causedBy.length - 1] == 'app') {
            var dataView = mobile.pageInfo(causedBy[1]).dataView;
            dataView.extension().calculate(causedBy[0]);
            return false;
        }
    }).on('touchstart MSPointerDown pointerdown', function (event) {
        if (_focusedInput)
            return;
        if (!pointerIsTouch(event))
            return;
        if (isInTransition) {
            event.preventDefault();
            return;
        }

        movementTestIsRequired = _focusedInput == null;
        var target = $(event.target),
            link = target.closest('a'),
            touch = startTouch = touchPoint(event);
        if (target.closest('.app-echo').length)
            movementTestIsRequired = false;
        if (link.length) {
            lastTouchedLink = link.data('touch-start', touch);
            if (!link.is(mobile.activeLinkBlacklist))
                if (link.parent().is('li')) {
                    lastTouchedLinkTimeout = setTimeout(function () {
                        if (lastTouchedLink)
                            activeLink(lastTouchedLink, false);
                    }, 200);
                }
                else
                    activeLink(link, false);
        }
    }).on('touchmove MSPointerMove pointermove', function (event) {
        if (!pointerIsTouch(event))
            return;
        var clearAndPreventDefault,
            target = $(event.target),
            link = $(lastTouchedLink),
            scrollable = target.closest('.ui-panel-inner,.app-wrapper'),
            touch = touchPoint(event),
            start = link.length && link.data('touch-start'),
            scrollInfo;
        //alert(target.attr('class'));
        if (iOS && (target.closest('.app-tabs,.app-map-info').length || target.closest('.app-bar-tools').length && !target.closest('.ui-btn').length)) {
            event.preventDefault();
            return;
        }


        //alert(String.format('{0},{1} - {2}, {3} {4}', startTouch.x, startTouch.y, touch.x, touch.y, event.type));

        if (movementTestIsRequired) {
            movementTestIsRequired = false;
            if (scrollable.length) {
                if (touch.y > startTouch.y)
                    clearAndPreventDefault = scrollable.scrollTop() == 0;
                else if (touch.y < startTouch.y) {
                    scrollInfo = getScrollInfo(scrollable);
                    clearAndPreventDefault = scrollInfo.height >= scrollInfo.maxHeight - 1;
                }
            }
            if (clearAndPreventDefault) {
                clearLastTouchedLink();
                activeLink();
                event.preventDefault();
                if (iOS)
                    touchScrolling = false;
                return;
            }
            if (target.is('.ui-panel-dismiss,.ui-popup-screen,.app-scrollable-cover')) {
                event.preventDefault();
                return;
            }
        }
        if (link.length) {
            if (start && (Math.abs(start.x - touch.x) > 0 || Math.abs(start.y - touch.y) > 0)) {
                activeLink();
                //alert(link.find('h3').css('background-color', 'orange!important').html());
                //alert(link.data('allow-tap'));
                //mobile._title.text(String.format('{5}: {0},{1} => {2},{3} {4}', start ? start.x : -1, start ? start.y : -1, touch.x, touch.y, link.find('h3').text(), link.data('allow-tap')));
            }
            clearLastTouchedLink();
        }
    }).on('touchend MSPointerUp pointerup', function (event) {
        if (!pointerIsTouch(event))
            return;
        var link = $(event.target).closest('a'),
            touch = touchPoint(event),
            start = link.length && link.data('touch-start');
        if (link.length) {
            if (!start || (Math.abs(start.x - touch.x) > 0 || Math.abs(start.y - touch.y) > 0))
                event.preventDefault();
        }
        clearLastTouchedLink();
    }).on('touchcancel MSPointerCancel pointercancel', function (event) {
        //var touch = touchPoint(event);
        //alert(String.format('{0},{1} - {2}, {3} {4}', startTouch.x, startTouch.y, touch.x, touch.y, event.type));
        if (!pointerIsTouch(event))
            return;
        activeLink();
        clearLastTouchedLink();
    }).on('scrollstart.app', function (event) {
        userActivity();
    }).on('scrolldir.app scrollstop.app', function (event) {
        if (!event.relatedTarget)
            return;
        // show/hide heading
        var scrollable = $(event.relatedTarget),
            scrollDir = scrollable.data('scroll-dir'),
            targetIsGrid = event.relatedTarget.find('ul:first').is('.app-grid'),
            gridDesc = targetIsGrid ? mobile.headingBar().find('.app-grid-desc') : null;
        if (scrollDir == 'up') {
            if (targetIsGrid && gridDesc.length && !gridDesc.is(':visible'))
                gridDesc.show();
            headingOnDemand();
        }
        else if (scrollDir == 'down') {
            if (!targetIsGrid || event.relatedTarget.scrollTop() == 0)
                hideHeadingBar();
            else if (targetIsGrid) {
                if (gridDesc.length && gridDesc.is(':visible'))
                    gridDesc.hide();
                headingOnDemand();
            }
        }
        // handle scroll stop
        if (event.type == 'scrollstop') {
            clearInterval(scrollStopTimeout);
            scrollStopTimeout = setTimeout(function (relatedTarget) {
                var scrollInfo = getScrollInfo(relatedTarget)
                if (scrollInfo.top <= 0 && scrollInfo.height <= scrollInfo.maxHeight + 1) {
                    fetchOnDemand();
                    fetchEchos();
                    //mobile.promo(scrollable.find('> .app-listview .app-selected'));
                }
            }, 250, event.relatedTarget);
        }
    }).on('contextmenu MSHoldVisual selectstart', function (event) {
        if (!isDesktop() && !($(event.target).is(':input')))
            event.preventDefault();
        else if ($('.ui-popup-active').length) {
            $('.ui-popup-active .ui-popup').popup('close');
            event.preventDefault();
        }
    })/*.on('selectstart', function (event) {
        if (!isDesktop() && !($(event.target).is(':input')))
            event.preventDefault();
    })*/.one('pagecreate', '#Main', function () {
        mobile._pageCreated = true;
    }).on('pagebeforechange', function (e, ui) {
        if (typeof ui.toPage == 'string' && ui.toPage.match(/^http/)) {
            transitionStatus(false);
            // Webkit navigates to the current page one more time after we add the page ID (hash) to a URL.
            // We need to prevent any futher navigation - the page is ready to be used. This is not happening in IE.
            if (_webkitPreventMainReload && getActivePageId() == 'Main' && location.href == ui.toPage)
                return false;
            return;
        }
        if (!ui.options.deferred)
            return;
        var pageInfo = mobile.pageInfo(),
            toPage = $(ui.toPage),
            toPageInfo = mobile.pageInfo(toPage.attr('id')),
            dataView = toPageInfo && toPageInfo.dataView;

        if (toPageInfo && !ui.toPage.prevObject) {
        }
        else {
            hideHeadingBar();
            extension = dataView && dataView.extension();
            mobile.search('configure', { 'allow': extension ? extension.options().quickFind : false });
        }
    }).on('vmousedown', '.app-static-label', function () {
        _lastFocusedInput = _focusedInput;
    }).on('dblclick', '.app-yardstick', function (event) {
        if (isDeveloperEvent(event)) {
            clearHtmlSelection();
            var width = $(event.currentTarget).attr('class').match(/app-width(\d+)/),
                popup = $('<div class="ui-content app-popup-message"/>').text(String.format('Item Width: {0}em', width[1])).popup({
                    history: false,
                    arrow: 'b,t',
                    x: event.clientX,
                    y: event.clientY,
                    overlayTheme: 'b',
                    afteropen: function () {
                    },
                    afterclose: function () {
                        destroyPopup(popup);
                    }
                }).popup('open').on('vclick', function () {
                    closePopup(popup);
                    return false;
                });
            return false;
        }
    }).on('dblclick', '.app-static-text', function (event) {
        if (skipTap) return;
        clearHtmlSelection();
        var pageInfo = mobile.pageInfo();
        if (!pageInfo)
            return;
        var dataView = pageInfo.dataView,
            allFields = dataView ? dataView._allFields : null,
            fieldName = $(event.target).attr('class').match(/(app-field-(\w+))/);
        if (fieldName && dataView) {
            autoFocus = false;
            dataView.extension().executeInContext('Edit', null, true);
            setTimeout(function () {
                $(allFields).each(function () {
                    if (allFields[this.AliasIndex].Name == fieldName[2]) {
                        fieldName = this.Name;
                        return false;
                    }
                });
                var input = $mobile.activePage.find('*:input.app-field-' + fieldName),
                    lookupInput = input.parent().find('.app-lookup-input'),
                    target = lookupInput.length ? lookupInput : input;
                target.focus().select();
                autoFocus = true;
            }, 500);
        }
        return false;
    }).on('vclick', 'a', handleLinkClick
    ).on('vclick', '.app-input-value', function (event) {
        $(event.target).prev().focus();
        return false;
    }).on('vclick', '.app-filter', function (event) {
        /*
        ***************************
        TO BE COMPLETED
        ***************************

        var target = $(event.target);
        if (target.closest('.app-listview,.app-bar-heading,.app-echo').length) {
            event.preventDefault();
            setTimeout(function () {
                showListPopup({
                    anchor: target, yOffset: 'bottom', x: event.pageX, items: [
                        {
                            text: resourcesMobile.ClearFilter, icon: 'delete', callback: function () {

                            }
                        }
                    ]
                });
            }, 200);
            return false;
        }
        */
    }).on('vclick contextmenu', '.app-grid-header > span:not(.app-btn-more)', function (event) {
        var target = $(event.target),
            options = { x: event.pageX, y: null };
        if (target.is('.app-indicator'))
            target = target.parent();
        target.addClass('ui-btn-active');
        if (options.x)
            options.y = target.offset().top + target.outerHeight() * .75;
        event.preventDefault();
        setTimeout(function () {
            target.removeClass('ui-btn-active');
            showFieldContext(target, options);
        }, 200);
        return false;
    }).on('keydown keypress', function (event) {
        var target = $(event.target),
            toolbar = mobile._toolbar,
            isKeyDown = event.type == 'keydown',
            text, key = event.key, keyCode = event.keyCode,
            searchButton, searchInput,
            isF3 = isKeyDown && (keyCode == 114 || keyCode == 70 && event.ctrlKey),
            isEsc = isKeyDown && keyCode == 27,
            scrollable, scrollableTop, scrollableBottom,
            dataView;
        if (isKeyDown && !(isEsc || isF3))
            return;

        if (!_focusedInput && !target.is('#app-input-search')) {
            text = String.fromCharCode(event.which);
            if (text.match(/[\w\-\"]/) || isEsc || isF3) {
                if (advancedSearchPageIsActive() && !_pendingQueryText) {
                    if (isF3) {
                        setTimeout(function () {
                            switchToQuickFind(mobile._contextButton);
                        });
                        return false;
                    }
                    if (isEsc && !$body.find('.ui-popup-active').length) {
                        clickMenuButton();
                        return false;
                    }
                }
                else if (getActivePageId() == 'taskassistant' && isEsc) {
                    clickMenuButton();
                    return false;
                }
                scrollable = $mobile.activePage.find('.app-wrapper');
                if (scrollable.length) {
                    scrollableTop = scrollable.offset().top;
                    scrollableBottom = scrollableTop + scrollable.height() - 1;
                    $mobile.activePage.find('.app-echo-controls .ui-btn.ui-icon-search').each(function () {
                        var button = $(this),
                            top;
                        if (button.is(':visible')) {
                            top = button.offset().top;
                            if (top >= scrollableTop && top < scrollableBottom - 75) {
                                searchButton = button;
                                dataView = $app.find(button.closest('.app-echo').attr('data-for'));
                                return false;
                            }
                        }
                    });
                }
                if (!searchButton) {
                    searchButton = toolbar.find('.ui-icon-search:visible');
                    dataView = mobile.dataView();
                }
                if (searchButton.length) {
                    if (isEsc) {
                        if (dataView && dataView.extension().quickFind()) {
                            quickFind(dataView, '');
                            resetInstruction(dataView);
                            higlightButton(searchButton);
                        }
                        else
                            return false;
                    }
                    else if (isF3) {
                        searchButton.trigger('vclick', false);
                        higlightButton(searchButton);
                    }
                    else if (event.type == 'keypress') {
                        if (advancedSearchPageIsActive())
                            return;
                        if (_pendingQueryText != null)
                            text = _pendingQueryText + text;
                        _pendingQueryText = text;
                        if (_pendingQueryText.length == 1) {
                            searchButton.trigger('vclick', false);
                            higlightButton(searchButton);
                        }
                    }
                    return false;
                }
            }
        }
        if (isF3)
            return false;
    });

    // window event handlers
    var resizeStarted;
    $window.on('resize', function () {
        if (!resizeStarted) {
            resizeStarted = true;
            hideMenuStrip();
            $('.app-echo-controls').hide();
            mobile._toolbarButtons.hide();
        }
    }).on('throttledresize', function () {
        resizeStarted = false;
        updateSidebarVisibility();
        $('.ui-panel-dismiss').height($mobile.getScreenHeight());
        if (isDesktop())
            resetPageHeight();
        refreshContextSidebar(false, null, function () {
            hideHeadingBar();
            headingOnDemand();
            fitTabs();
        });
        fetchOnDemand();
        clearTimeout(echoTimeout);
        echoTimeout = setTimeout(function () {
            var scrollable = $mobile.activePage.find('.app-wrapper');
            adjustScrollableContainers(scrollable, true);
            fetchEchos(true);
            fetchEchos(false);
            mobile.refreshMenuStrip();
            var activePageId = getActivePageId();
            $(mobile._pages).each(function () {
                var pageInfo = this;
                if (pageInfo.echoId && pageInfo.id != activePageId)
                    $('#' + pageInfo.echoId + ' .app-echo-controls').addClass('app-stale');
            });
            //mobile.promo(scrollable.find('> .app-listview .app-selected'))
        }, 1000);
        var popup = $('.ui-popup');
        if (popup.is('.app-popup-message,.app-popup-listview'))
            closePopup(popup);
        else
            popup.popup('reposition', { positionTo: 'window' });
        skipTap = false;
    }).on('orientationchange', function () {
        setTimeout(function () {
            if (!_focusedInput)
                resetPageHeight();
            setTimeout(function () {
                if (!_focusedInput)
                    resetPageHeight();
            }, 500);
        }, 500);
    });

    //if (userAgent.match(/iPad;.*CPU.*OS 7_\d/i)) {
    //    $('html').addClass('ipad ios7');
    //}

    Sys.Application.add_init(function () {
    });

    Sys.Application.add_load(function () {
        mobile._appLoaded = true;
    });

    Web.DataView.MobileGrid.registerClass('Web.DataView.MobileGrid', Web.DataView.MobileBase);
    Web.DataView.MobileForm.registerClass('Web.DataView.MobileForm', Web.DataView.MobileBase);

})();

