// ILIA MATROSOV
// 2016

(function(global){
    function Slider(options){
        var sliderElem = options.elem,
            thumbElem = options.thumb || sliderElem.children[0],
            progressElem = options.progress || null,
            progressElemRight = options.progressRight || null,
            bubbleElem = options.bubble || null,
            clickAreas = options.clickAreas || [],
            max = options.max || 100,
            min = options.min || 0,
            step = options.step || 1,
            currentPosition = options.currentPosition || 0,
            coef = (sliderElem.offsetWidth - thumbElem.offsetWidth)/(max - min),
            newLeft,
            isDrag = false,
            throttledDispatch; //dispatch not often than throttledDispatch

        if (options.throttle) {
            throttledDispatch = throttle(dispatchEvent,options.throttle);
        } else {
            throttledDispatch = dispatchEvent;
        }

        setValue(currentPosition);

        clickAreas.push(sliderElem);
        clickAreas.push(progressElem);
        clickAreas.push(thumbElem);
        clickAreas.push(bubbleElem);
        clickAreas.forEach(addClickListener);

        function addClickListener(area){
            if (area) area.addEventListener("mousedown",onMouseDown);
        }

        document.addEventListener("mousemove",onMouseMove);
        document.addEventListener("mouseup",onMouseUP);

        function onMouseDown(e) {
            startDrag();
            onMouseMove(e);
        };

        function onMouseMove(e) {
            e.preventDefault();
            if (!isDrag) return;

            var sliderCoords = getCoords(sliderElem);

            newLeft = e.pageX - sliderCoords.left - thumbElem.offsetWidth/2;

            rightEdge = sliderElem.offsetWidth - thumbElem.offsetWidth;

            if (newLeft < 0) {
                newLeft = 0;
            }
            if (newLeft > rightEdge) {
                newLeft = rightEdge;
            }

            if (currentPosition == convertCoordinateToValue(newLeft)) return; //if old position == new position => do nothing

            currentPosition =  convertCoordinateToValue(newLeft);
            updatePosition();
            throttledDispatch('slide');
            //console.log("dispatchEvent('slide');")
        }

        function startDrag(){
            isDrag = true;
        }

        function stopDrag(){
            isDrag = false;
        }

        function updatePosition(){
            thumbElem.style.left = newLeft + 'px';
            if (progressElem) progressElem.style.width = newLeft + thumbElem.offsetWidth/2 + 'px';
            if (progressElemRight) progressElemRight.style.width = sliderElem.offsetWidth - (newLeft + thumbElem.offsetWidth/2) + 'px';
            if (bubbleElem) bubbleElem.style.left = newLeft - bubbleElem.offsetWidth/2 + thumbElem.offsetWidth/2 + 'px';
        }

        function onMouseUP(e){
            if (!isDrag) return;

            stopDrag();
            dispatchEvent('change');
        }

        thumbElem.addEventListener("dragstart",function(e){
            e.preventDefault();
        });

        function getCoords(elem) { // кроме IE8-
            var box = elem.getBoundingClientRect();

            return {
                top: box.top + pageYOffset,
                left: box.left + pageXOffset
            };
        }

        function convertCoordinateToValue(coordinate){
            var value = Math.round(newLeft/coef) + min;
            return Math.round(value/step)*step;
        }

        function convertValueToCoordinate(value){
            return (value - min) * coef;
        }

        function dispatchEvent(name){
            var sliderEvent = new CustomEvent(name,{
                bubbles: true,
                detail: currentPosition
            });
            sliderElem.dispatchEvent(sliderEvent);
            //console.log(name,currentPosition);
        }

        function throttle(func, ms) {

            var isThrottled = false,
                savedArgs,
                savedThis;

            function wrapper() {

                if (isThrottled) { // (2)
                    savedArgs = arguments;
                    savedThis = this;
                    return;
                }

                func.apply(this, arguments); // (1)

                isThrottled = true;

                setTimeout(function() {
                    isThrottled = false; // (3)
                    if (savedArgs) {
                        wrapper.apply(savedThis, savedArgs);
                        savedArgs = savedThis = null;
                    }
                }, ms);
            }

            return wrapper;
        }

        function setValue(value, isInternal){
            if (value > max) value = max;
            if (value < 0) value = 0;
            currentPosition = value;

            newLeft = convertValueToCoordinate(value);
            updatePosition();
            dispatchEvent('change');
        }



        Object.defineProperty(this, "value", {
            get: function() {
                return currentPosition;
            }
        });

        this.setValue = setValue;
        this.updatePosition = updatePosition;
        this.sliderElement = sliderElem;
    }

    function DepositCalculator(options){
        var calculatorElement = options.calculatorElement,
            slider = options.slider,
            sliderElement = slider.sliderElement,
            resultElement = options.resultElement,
            depositElement = options.depositElement,
            bubbleElement = options.bubbleElement,
            buttonsContainer = options.buttonsContainer,
            yearProfit = options.yearProfit || 146, // profit in percents/year
            periods = options.periods || [1, 3, 6], //array of periods available
            periodName = options.periodName || "мес",
            currentPeriod,
            currentValue;

        init();

        function init(){
            generateButtons();
            currentValue = slider.value;
            updateTextFields();

            sliderElement.addEventListener("slide",onChange.bind(this));
            buttonsContainer.addEventListener("click",onButtonsClick);
        }

        function onChange(e){
            //console.log(e);
            currentValue = e.detail;
            updateTextFields();
        }

        function updateTextFields(){
            if (resultElement) resultElement.innerHTML = getValueInText(currentValue + calculateProfit());
            if (depositElement) depositElement.innerHTML = getValueInText(currentValue);
            if (bubbleElement) bubbleElement.innerHTML = getValueInText(currentValue);
        }

        function calculateProfit(){
            return Math.floor(currentValue * currentPeriod * yearProfit/100/12);
        }

        function getValueInText(value){
            return value.toLocaleString("ru",{
                    style: "currency",
                    currency: "RUB",
                    minimumFractionDigits: 0
                });
        }

        function generateButtons(){
            periods.forEach(function(buttonValue, i){
                var button = document.createElement("button");
                button.classList.add("d-c-period-button");
                button.dataset.period = buttonValue;
                if (i == 0) {
                    button.classList.add("d-c-period-button--active");
                    currentPeriod = buttonValue;
                }
                button.textContent = buttonValue + " " + periodName;
                buttonsContainer.appendChild(button);
            });
        }

        function onButtonsClick(e){
            var button = e.target.closest(".d-c-period-button");
            if (!button) return;
            currentPeriod = button.dataset.period;
            var buttons = buttonsContainer.querySelectorAll(".d-c-period-button");
            Array.prototype.forEach.call(buttons,function(button){
                button.classList.remove("d-c-period-button--active");
            });
            button.classList.add("d-c-period-button--active");
            updateTextFields();
        }
    }

    var calculatorElement = document.querySelector("#d-calc-1");

    var calculatorSlider = new Slider({
        elem: calculatorElement.querySelector(".d-c-slider__body"),
        thumb: calculatorElement.querySelector(".d-c-slider__thumb"),
        progress: calculatorElement.querySelector(".d-c-slider__progress"),
        progressRight: calculatorElement.querySelector(".d-c-slider__bright-box"),
        bubble: calculatorElement.querySelector(".d-c-slider__bubble"),
        clickAreas:[
            calculatorElement.querySelector(".d-c-slider__background"),
            calculatorElement.querySelector(".d-c-slider__bright-box"),
            calculatorElement.querySelector(".d-c-slider__click-area")
        ],
        max: 1000000,
        min: 30000,
        step: 1000,
        currentPosition: 30000,
        throttledDispatch: 100
    });

    var calculator = new DepositCalculator({
        elem: calculatorElement,
        slider: calculatorSlider,
        depositElement: calculatorElement.querySelector(".d-c-result__deposit"),
        resultElement: calculatorElement.querySelector(".d-c-result__final-summ"),
        bubbleElement: calculatorElement.querySelector(".d-c-slider__bubble"),
        buttonsContainer: calculatorElement.querySelector(".d-c-period-button-container"),
        periods: [1, 3, 6],
        yearProfit: 6.4,
        periodName: "мес"
    });

})(window);