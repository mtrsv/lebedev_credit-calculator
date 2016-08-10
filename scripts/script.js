// ILIA MATROSOV
// 2016

(function(global){
    function Slider(options){
        var sliderElem = options.elem,
            thumbElem = options.thumb || sliderElem.children[0],
            progressElem = options.progress || null,
            progressElemRight = options.progressRight || null,
            bubbleElem = options.bubble || null,
            max = options.max || 100,
            min = options.min || 0,
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

        sliderElem.addEventListener("mousedown",onMouseDown);
        progressElem.addEventListener("mousedown",onMouseDown);
        thumbElem.addEventListener("mousedown",onMouseDown);

        document.addEventListener("mousemove",onMouseMove);
        document.addEventListener("mouseup",onMouseUP);

        function onMouseDown(e) {
            startDrag();
            onMouseMove(e);
        };

        function onMouseMove(e) {
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
            return Math.round(newLeft/coef) + min;
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
            yearProfit = options.yearProfit || 146, // profit in percents/year
            periods = options.options || [1, 3, 6], //array of periods available
            currentPeriod;

        sliderElement.addEventListener("slide",onChange.bind(this));

        function onChange(e){
            //console.log(e);
            updateTextFields(e.detail);
        }

        function updateTextFields(value){
            if (resultElement) resultElement.innerHTML = getValueInText(value);
            if (depositElement) depositElement.innerHTML = getValueInText(value + calculateProfit());
            if (bubbleElement) bubbleElement.innerHTML = getValueInText(value);
        }

        function calculateProfit(){
            return 1000;
        }

        function getValueInText(value){
            return value.toLocaleString("ru",{
                    style: "currency",
                    currency: "RUB",
                    minimumFractionDigits: 0
                });
        }
    }

    var calculatorElement = document.querySelector("#d-calc-1");

    var calculatorSlider = new Slider({
        elem: calculatorElement.querySelector(".d-c-slider__body"),
        thumb: calculatorElement.querySelector(".d-c-slider__thumb"),
        progress: calculatorElement.querySelector(".d-c-slider__progress"),
        progressRight: calculatorElement.querySelector(".d-c-slider__bright-box"),
        bubble: calculatorElement.querySelector(".d-c-slider__bubble"),
        max: 1000000,
        min: 30000,
        currentPosition: 30000
    });

    var calculator = new DepositCalculator({
        elem: calculatorElement,
        slider: calculatorSlider,
        depositElement: calculatorElement.querySelector(".d-c-result__deposit"),
        resultElement: calculatorElement.querySelector(".d-c-result__final-summ"),
        bubbleElement: calculatorElement.querySelector(".d-c-slider__bubble")
    });

})(window);