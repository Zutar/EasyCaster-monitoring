let shortChart = null;
let longChart = null;
let shortChartDate = new Date();
let longChartDate = new Date();

function renderShortChart(channel, stream, series, period, page){
    fetch(`/chart/data?channel=${channel}&stream=${stream}&series=${series}&period=${period}&page=${page}`)
        .then(response => response.json())
        .then(data => {
            chartData = [];
            for(let i = 0; i < data.length; i++){
                chartData.push({ date: new Date(data[i].time), bitrate: data[i].bitrate, min: data[i].min_bitrate });
            }

            const startTimeInput = document.querySelector('.chart__start-time-short');
            const endTimeInput = document.querySelector('.chart__end-time-short');
            const startDateInput = document.querySelector('.chart__start-date-short');
            const endDateInput = document.querySelector('.chart__end-date-short');

            const startDate = new Date(shortChartDate - 1000 * 60 * 60 * 2);
            const endDate = shortChartDate;

            startTimeInput.value = startDate.toLocaleTimeString();
            endTimeInput.value = endDate.toLocaleTimeString();
            startDateInput.value = startDate.toISOString().slice(0, 10);
            endDateInput.value = endDate.toISOString().slice(0, 10);

            let chart = am4core.create("shortChart", am4charts.XYChart);
            chart.hiddenState.properties.opacity = 0; // this creates initial fade-in
            chart.paddingRight = 20;
            chart.data = chartData;

            let dateAxis = chart.xAxes.push(new am4charts.DateAxis());
            dateAxis.renderer.grid.template.location = 0;
            dateAxis.minZoomCount = 190;

            // this makes the data to be grouped
            dateAxis.groupData = true;
            dateAxis.groupCount = 2500;

            let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
            valueAxis.min = 0;
            valueAxis.max = 4000;
            valueAxis.renderer.minGridDistance = 20;
            valueAxis.extraMin = 0.1;
            valueAxis.extraMax = 0.1;


            // Create series
            let series = chart.series.push(new am4charts.LineSeries());
            series.dataFields.valueY = "bitrate";
            series.dataFields.dateX = "date";
            series.strokeWidth = 1;
            series.minBulletDistance = 10;
            series.tooltipText = "{valueY}";
            series.tooltipText = "bitrate: {valueY.value}";
            series.tooltip.pointerOrientation = "vertical";
            series.tooltip.background.cornerRadius = 20;
            series.sequencedInterpolation = true;
            series.stroke = chart.colors.getIndex(6);
            series.tooltip.label.padding(12,12,12,12);

            // Add cursor
            chart.cursor = new am4charts.XYCursor();
            chart.cursor.xAxis = dateAxis;
            chart.cursor.snapToSeries = series;

            // Add scrollbar
            chart.scrollbarX = new am4charts.XYChartScrollbar();
            chart.scrollbarX.series.push(series);

            shortChart = chart;
        });
}

function renderLongChart(channel, stream, series, period, page){
    fetch(`/chart/data?channel=${channel}&stream=${stream}&series=${series}&period=${period}&page=${page}`)
        .then(response => response.json())
        .then(data => {
            chartData = [];
            for(let i = 0; i < data.length; i++){
                chartData.push({ date: new Date(data[i].time), bitrate: data[i].bitrate, min: data[i].min_bitrate });
            }

            const startTimeInput = document.querySelector('.chart__start-time-long');
            const endTimeInput = document.querySelector('.chart__end-time-long');
            const startDateInput = document.querySelector('.chart__start-date-long');
            const endDateInput = document.querySelector('.chart__end-date-long');

                const startDate = new Date(longChartDate - 1000 * 60 * 60 * 24 * 7);
                const endDate = longChartDate;

            startTimeInput.value = startDate.toLocaleTimeString();
            endTimeInput.value = endDate.toLocaleTimeString();
            startDateInput.value = startDate.toISOString().slice(0, 10);
            endDateInput.value = endDate.toISOString().slice(0, 10);

            let chart = am4core.create("longChart", am4charts.XYChart);
            chart.hiddenState.properties.opacity = 0; // this creates initial fade-in
            chart.paddingRight = 20;
            chart.data = chartData;

            let dateAxis = chart.xAxes.push(new am4charts.DateAxis());
            dateAxis.renderer.grid.template.location = 0;
            dateAxis.minZoomCount = 300;

            // this makes the data to be grouped
            dateAxis.groupData = true;
            dateAxis.groupCount = 2500;

            let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
            valueAxis.min = 0;
            valueAxis.max = 4000;
            valueAxis.renderer.minGridDistance = 20;
            valueAxis.extraMin = 0.1;
            valueAxis.extraMax = 0.1;


            // Create series
            let series = chart.series.push(new am4charts.LineSeries());
            series.dataFields.valueY = "bitrate";
            series.dataFields.openValueY = "min";
            series.dataFields.dateX = "date";
            series.strokeWidth = 1;
            series.minBulletDistance = 10;
            series.tooltipText = "{valueY}";
            series.tooltipText = "bitrate: {valueY.value} min: {openValueY.value}";
            series.tooltip.pointerOrientation = "vertical";
            series.tooltip.background.cornerRadius = 20;
            series.sequencedInterpolation = true;
            series.fillOpacity = 0.3;
            series.tooltip.background.fillOpacity = 0.5;
            series.tooltip.label.padding(12,12,12,12);

            let minSeries = chart.series.push(new am4charts.LineSeries());
            minSeries.dataFields.dateX = "date";
            minSeries.dataFields.valueY = "min";
            minSeries.sequencedInterpolation = true;
            minSeries.defaultState.transitionDuration = 1500;
            minSeries.stroke = chart.colors.getIndex(6);
            minSeries.tensionX = 0.8;

            // Add cursor
            chart.cursor = new am4charts.XYCursor();
            chart.cursor.xAxis = dateAxis;
            chart.cursor.snapToSeries = series;

            // Add scrollbar
            chart.scrollbarX = new am4charts.XYChartScrollbar();
            chart.scrollbarX.series.push(series);

            longChart = chart;
        });
}

am4core.ready(function() {
    const urlParams = new URLSearchParams(location.search);
    const channel = urlParams.get('channel');
    const stream = urlParams.get('stream');
    let shortChartPage = 1;
    let longChartPage = 1;

    renderShortChart(channel, stream, '5s', '2h', shortChartPage);
    renderLongChart(channel, stream,'1m', '7d', longChartPage);

    const shortChartPrev = document.querySelector('.chart__prev-data-short');
    const shortChartNext = document.querySelector('.chart__next-data-short');
    const longChartPrev = document.querySelector('.chart__prev-data-long');
    const longChartNext = document.querySelector('.chart__next-data-long');

    shortChartPrev.onclick = () => {
            shortChartPage += 1;
            shortChart.dispose();
            shortChartDate = new Date(shortChartDate - 1000 * 60 * 60 * 2);
            renderShortChart(channel, stream, '5s', '2h', shortChartPage);
    }

    shortChartNext.onclick = () => {
            shortChartPage -= 1;
            shortChart.dispose();
            shortChartDate = new Date(shortChartDate + 1000 * 60 * 60 * 2);
            renderShortChart(channel, stream, '5s', '2h', shortChartPage);
    }

    longChartPrev.onclick = () => {
            longChartPage += 1;
            longChart.dispose();
            longChartDate = new Date(longChartDate - 1000 * 60 * 60 * 24 * 7);
            renderLongChart(channel, stream, '1m', '7d', longChartPage);
    }

    longChartNext.onclick = () => {
            longChartPage -= 1;
            longChart.dispose();
            longChartDate = new Date(longChartDate + 1000 * 60 * 60 * 24 * 7);
            renderLongChart(channel, stream, '1m', '7d', longChartPage);
    }
});
