//Dont change it
requirejs(['ext_editor_1', 'jquery_190', 'raphael_210'],
    function (ext, $, TableComponent) {

        var cur_slide = {};

        ext.set_start_game(function (this_e) {
        });

        ext.set_process_in(function (this_e, data) {
            cur_slide["in"] = data[0];
        });

        ext.set_process_out(function (this_e, data) {
            cur_slide["out"] = data[0];
        });

        ext.set_process_ext(function (this_e, data) {
            cur_slide.ext = data;
            this_e.addAnimationSlide(cur_slide);
            cur_slide = {};
        });

        ext.set_process_err(function (this_e, data) {
            cur_slide['error'] = data[0];
            this_e.addAnimationSlide(cur_slide);
            cur_slide = {};
        });

        ext.set_animate_success_slide(function (this_e, options) {
            var $h = $(this_e.setHtmlSlide('<div class="animation-success"><div></div></div>'));
            this_e.setAnimationHeight(115);
        });

        ext.set_animate_slide(function (this_e, data, options) {
            var $content = $(this_e.setHtmlSlide(ext.get_template('animation'))).find('.animation-content');
            if (!data) {
                console.log("data is undefined");
                return false;
            }

            var checkioInput = data.in;

            if (data.error) {
                $content.find('.call').html('Fail: checkio(' + JSON.stringify(checkioInput) + ')');
                $content.find('.output').html(data.error.replace(/\n/g, ","));

                $content.find('.output').addClass('error');
                $content.find('.call').addClass('error');
                $content.find('.answer').remove();
                $content.find('.explanation').remove();
                this_e.setAnimationHeight($content.height() + 60);
                return false;
            }

            var rightResult = data.ext["answer"];
            var userResult = data.out;
            var result = data.ext["result"];
            var result_addon = data.ext["result_addon"];


            //if you need additional info from tests (if exists)
            var explanation = data.ext["explanation"];

            $content.find('.output').html('&nbsp;Your result:&nbsp;' + JSON.stringify(userResult));

            if (!result) {
                $content.find('.call').html('Fail: checkio(' + JSON.stringify(checkioInput) + ')');
                $content.find('.answer').html('Right result:&nbsp;' + JSON.stringify(rightResult));
                $content.find('.answer').addClass('error');
                $content.find('.output').addClass('error');
                $content.find('.call').addClass('error');
            }
            else {
                $content.find('.call').html('Pass: checkio(' + JSON.stringify(checkioInput) + ')');
                $content.find('.answer').remove();
            }
            //Dont change the code before it

            var canvas = new AreaConvexPolygonCanvas();
            canvas.createCanvas($content.find(".explanation")[0], checkioInput);
            canvas.animateCanvas();

            this_e.setAnimationHeight($content.height() + 60);

        });

        var $tryit;
//
        ext.set_console_process_ret(function (this_e, ret) {
            $tryit.find(".checkio-result-in").html(ret);
        });

        ext.set_generate_animation_panel(function (this_e) {

            $tryit = $(this_e.setHtmlTryIt(ext.get_template('tryit')));
            var tcanvas = new AreaConvexPolygonCanvas(8);
            tcanvas.createCanvas($tryit.find(".tryit-canvas")[0], []);
//            tcanvas.animateCanvas();
            tcanvas.createFeedback();

            $tryit.find('.bn-reset').click(function (e) {
                tcanvas.resetCanvas();
                return false;
            });
            $tryit.find('.bn-check').click(function (e) {
                var data = tcanvas.getPoints();
                this_e.sendToConsoleCheckiO(data);
                e.stopPropagation();
                return false;
            });

        });

        function AreaConvexPolygonCanvas(N) {
            var zx = 20;
            var zy = 20;
            var cellSize = 30;
            var cellN = N || 10;
            var fullSize = zx * 2 + cellSize * (cellN + 0.5);

            var colorDark = "#294270";
            var colorOrange = "#F0801A";
            var colorBlue = "#6BA3CF";
            var colorLightBlue = "#69B3E3";
            var colorWhite = "#FFFFFF";
            var attrAxis = {"stroke": colorDark, "stroke-width": 2, "arrow-end": "classic"};
            var attrEdge = {"stroke": colorDark, "stroke-width": 2, "stroke-linecap": "round",
                "fill": colorBlue, "fill-opacity": 0};
            var attrInnerLine = {"stroke": colorLightBlue, "stroke-width": 1, "stroke-dasharray": ["-"]};
            var attrText = {"font-family": "Verdana", "font-size": 14, "stroke": colorDark};
//            var attrPointText = {"font-family": "Verdana", "font-size": 0, "stroke": colorBlue, "fill": colorDark};
            var attrPoint = {"stroke": colorOrange, "fill": colorOrange, "r": cellSize / 4};

            var delay = 300;
            var stepDelay = delay * 1.2;

            var paper;
            var pointSet;
            var polygon;

            var createLinePath = function(x1, y1, x2, y2) {
                return "M" + x1 + "," + y1 + "L" + x2 + "," + y2;
            };

            this.createCanvas = function(dom, dataInput) {
                paper = Raphael(dom, fullSize, fullSize, 0, 0);
                pointSet = paper.set();
                for (var i = 1; i <= cellN; i++) {
                    paper.path(createLinePath(
                            zx, fullSize - zy - i * cellSize,
                            zx + cellN * cellSize + zx / 2, fullSize - zy - i * cellSize)
                    ).attr(attrInnerLine);

                    paper.path(createLinePath(
                            zx + i * cellSize, fullSize - zy,
                            zx + i * cellSize, fullSize - zy - cellN * cellSize - zy / 2)
                    ).attr(attrInnerLine);
                    paper.text(zx + i * cellSize, fullSize - zy / 2, String(i)).attr(attrText);
                    paper.text(zx / 2, fullSize - zy - i * cellSize, String(i)).attr(attrText);
                }

                paper.path(createLinePath(zx, fullSize - zy, zx, zy)).attr(attrAxis);
                paper.text(zx, zy / 2, "Y").attr(attrText);
                paper.path(createLinePath(zx, fullSize - zy, fullSize - zx, fullSize - zy)).attr(attrAxis);
                paper.text(fullSize - zx / 2, fullSize - zy, "X").attr(attrText);
                paper.text(zx / 2, fullSize - zy / 2, "0").attr(attrText);

                for (i = 0; i < dataInput.length; i++) {
                    var x = dataInput[i][0];
                    var y = dataInput[i][1];
                    var point = paper.circle(x * cellSize + zx,
                        fullSize - zy - cellSize * y, 1).attr(attrPoint);
                    pointSet.push(point);
                }
            };

            this.animateCanvas = function() {
                var point = pointSet[0];
                polygon = paper.path(createLinePath(
                    point.attr("cx"),
                    point.attr("cy"),
                    point.attr("cx"),
                    point.attr("cy")
                )).attr(attrEdge);
                pointSet.toFront();
                var newPath = String(polygon.attr("path"));
                for (var i = 0; i < pointSet.length; i++) {
                    var nextPoint = pointSet[i == pointSet.length - 1 ? 0 : i + 1];
                    newPath = newPath + "L" + nextPoint.attr("cx") + "," + nextPoint.attr("cy");
                    setTimeout(function(){
                        var p = newPath;
                        return function() {
                            polygon.animate({"path": p}, delay);
                        }
                    }(), stepDelay * i)
                }
                setTimeout(function(){
                    return function() {
                        polygon.animate({"fill-opacity": 0.5}, delay);
                    }
                }(), stepDelay * i)
            };

            this.createFeedback = function(){

                var activeRect = paper.rect(zx  + cellSize / 2,
                    fullSize - zy - cellN * cellSize - cellSize / 2,
                    cellN * cellSize,
                    cellN * cellSize
                ).attr({"fill": colorWhite, "opacity": 0});
                activeRect.click(function(e) {
                    var x = Math.round(((e.offsetX || e.layerX) - zx) / cellSize);
                    var y = Math.round((fullSize - (e.offsetY || e.layerY) - zy) / cellSize);

                    var point = paper.circle(x * cellSize + zx,
                        fullSize - zy - cellSize * y, 1).attr(attrPoint);
                    pointSet.push(point);
                    if (pointSet.length === 1) {
                        polygon = paper.path(createLinePath(
                            point.attr("cx"),
                            point.attr("cy"),
                            point.attr("cx"),
                            point.attr("cy")
                        )).attr(attrEdge).attr("fill-opacity", 0.5);
                        pointSet.toFront();
                        activeRect.toFront();
                    }
                    else {
                        var newPath = polygon.attr("path");
                        newPath.splice(newPath.length - 1, 1);
                        newPath += "L" + point.attr("cx") + "," + point.attr("cy");
                        newPath += "L" + pointSet[0].attr("cx") + "," + pointSet[0].attr("cy");
                        polygon.animate({"path": newPath}, delay);
                    }
                })
            };

            this.resetCanvas = function() {
                if (polygon) {
                    polygon.remove();
                }
                if (pointSet && pointSet.length) {
                    pointSet.remove();
                    pointSet = paper.set();
                }

            };

            this.getPoints = function() {
                var res = [];
                if (pointSet) {
                    for (var i = 0; i < pointSet.length; i++) {
                        var x = Math.round((pointSet[i].attr("cx") - zx) / cellSize);
                        var y = Math.round((fullSize - pointSet[i].attr("cy") - zy) / cellSize);
                        res.push([x, y]);
                    }
                }
                return res;
            };
        }

    }
);
