$(document).ready(function() {

    var dropZone = $('body');
    var counter = 0;

    var height = 0;
    var memeText = "";
    var canvas = new fabric.StaticCanvas('dankCanvas');
    canvas.setBackgroundColor("#FFFFFF");
    var imgInstance;
    var fullFile;
    var textInstance;
    var MEME_WIDTH = canvas.width;
    var FONT_SIZE = 38;
    var FONT_FAMILY = "HelveticaNeue-Light, Helvetica Neue, Arial";
    var TEXT_HORIZONTAL_PADDING = 16;
    var TEXT_VERTICAL_PADDING = 10;
    var IMAGE_PADDING = 16;

    var attributionInstance;
    var ATTRIBUTION_FONT_SIZE = 20;
    var ATTRIBUTION_SIDE_PADDING = 8;
    var ATTRIBUTION_BOTTOM_PADDING = 6;

    var logoInstance;

    var attributionShowing = false;
    initAttribution();
    initText();

    /*---- Template jquery ----*/

    $('#custom-template').change(function() {
        if ($(this).is(':checked')) {
            $('#custom-template-name').css('display', 'block');
        } else {
            $('#custom-template-name').css('display', 'none');
        }
        checkIfImageCanBeUploaded();
    });

    $('#private-checkbox').change(function() {
        if ($(this).is(':checked')) {
            $('#custom-template-field').css('display', 'none');
        } else {
            $('#custom-template-field').css('display', 'block');
        }
        checkIfImageCanBeUploaded();
    })

    $('#templateName').keyup(function() {
        checkIfImageCanBeUploaded();
    })

    /*----  Image dropzone  ----*/

    if (!$('.default-images').length) {
        dropZone.on('dragenter', function(e) {
            // e.stopPropagation();
            // e.preventDefault();
            $('body').addClass("dropBackground");
            counter++;
        });
        dropZone.on('dragover', function(e) {
            e.stopPropagation();
            e.preventDefault();
        });
        dropZone.on('drop', function(e) {
            $('body').removeClass("dropBackground");
            e.preventDefault();
            var files = e.originalEvent.dataTransfer.files;
            placeFileOnCanvas(files);
        });
        dropZone.on('dragleave', function(e) {
            counter--;
            if (counter === 0 || counter < 0) {
                $('body').removeClass("dropBackground");
            }
        })
        $('window').mouseleave(function() {
            $('body').removeClass("dropBackground");
        })
    }
    $("#image-file").change(function(e) {
        if (this.files && this.files[0]) {
            placeFileOnCanvas(this.files);
        }
    });
    $(".default-image").click(function(e) {
        var url = $(this).find("img").attr("src")
        placeDefaultImage(url)
    })

    var baseURL = $("#baseMeme").data("base-url");
    if (baseURL) {
        placeDefaultImage(baseURL);
    };

    function placeDefaultImage(src) {
        var image = new Image();
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = src;
        image.onload = function() {
            setImageInstance(this);
        };
    }

    function placeFileOnCanvas(files) {
        var file = files[0];
        fullFile = file;
        if (typeof FileReader !== "undefined" && file.type.indexOf("image") != -1 && (file.type == 'image/jpeg' || file.type == 'image/png')) {
            var reader = new FileReader();
            reader.onload = function(evt) {
                var image = new Image();
                image.src = evt.target.result;

                image.onload = function() {
                    if (this !== undefined && this !== null) {
                        setImageInstance(this);
                    }
                };
            };
            reader.readAsDataURL(file);
        } else if (file.type == 'image/gif') {
            //             var reader = new FileReader();
            // reader.onload = function(evt) {
            //     var image = new Image();
            //     image.src = evt.target.result;
            //     image.width = 640;

            //     image.onload = function() {
            //         if (this !== undefined && this !== null) {
            //             $('#meme-zone').append(image)
            //         }
            //     };
            // };
            // reader.readAsDataURL(file);
        }
    }

    /*------ Draw Meme  ----*/

    var processingImage = false

    function setImageInstance(image) {
        if (processingImage) {
            return;
        } else {
            processingImage = true;
        }
        if (imgInstance !== "undefined") {
            canvas.remove(imgInstance);
        };
        changeRotation(image, function(image) {
            // fullImage = data;
            var fitWidth = canvas.width - 2 * IMAGE_PADDING;
            imgInstance = new fabric.Image(image, {
                left: IMAGE_PADDING,
                top: height,
                width: fitWidth,
                height: image.height * fitWidth / image.width
            });
            canvas.add(imgInstance);
            updateFabric();
            processingImage = false;
        });
    }

    function changeRotation(image, callback) {
        EXIF.getData(image, function() {
            var orientation = this.exifdata.Orientation;
            rotateImage(image, orientation, function(newImage, data) {
                return callback(newImage, data);
            })
        });
    }

    function updateFabric() {
        var height = 0;
        if (textInstance && textInstance.height) {
            height += textInstance.height + textInstance.top + TEXT_VERTICAL_PADDING;
        };
        if (imgInstance && imgInstance.height) {
            imgInstance.setTop(height);
            height += imgInstance.height + IMAGE_PADDING;
        } else {
            //Prevent canvas from shrinking
            height += 446;
        }
        if (attributionInstance && logoInstance) {
            attributionInstance.set({
                top: height - ATTRIBUTION_BOTTOM_PADDING - IMAGE_PADDING - attributionInstance.height
            });
            logoInstance.set({
                top: height - ATTRIBUTION_BOTTOM_PADDING - IMAGE_PADDING - logoInstance.height
            })
        }
        canvas.setHeight(height);
        checkIfImageCanBeUploaded();
        canvas.bringToFront(logoInstance)
        canvas.bringToFront(attributionInstance)
        canvas.renderAll();
    }

    function updateText(textValue) {
        memeText = textValue;
        textInstance.set({
            text: textValue
        }); //Change the text
        updateFabric()
    }

    function updateAttribution(textValue) {
        if (!attributionShowing) {
            addAttributionToCanvas();
        }
        attributionInstance.set({
            text: textValue
        });
        updateFabric()
    }

    // Publish
    function checkIfImageCanBeUploaded() {
        if (imgInstance !== undefined && memeText !== "" && !$('#downloadButton').hasClass("generating")) {
            if ($('#private-checkbox').is(':checked')) {
                disableButton(false);
            } else if ($('#custom-template').is(':checked') && $('#templateName').val().length < 3) {
                disableButton(true);
            } else {
                disableButton(false);
            }
        }
    }

    function disableButton(disable) {
        if (disable) {
            $('#downloadButton').attr("disabled", "true");
            $('#downloadButton').addClass("disabled");
        } else {
            $('#downloadButton').attr("disabled", "false");
            $('#downloadButton').removeAttr("disabled").removeClass("disabled");
        }
    }

    $('#downloadButton').click(function(e) {
        $('#downloadButton').prop("disabled", true);
        $('#downloadButton').addClass("generating");
        $('#downloadButton').html('Generate your meme <img src="/images/whitespinner.png" class="loading">')
        if (!attributionShowing) {
            addAttributionToCanvas();
        }
        logoInstance.opacity = 1;
        publishImage(fullFile, memeText);
    })

    function publishImage(fullFile, text) {
        $.ajax({
            url: '/signS3',
            type: 'POST',
            data: {
                text: text,
                fileType: 'image/jpeg'
            },
            success: function(response) {
                uploadFile(fullFile, JSON.parse(response).signedRequest, JSON.parse(response).slug)
            },
            error: function() {
                disableButton(false)
            }
        });
    }

    function uploadFile(file, signedRequest, slug) {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', signedRequest);
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    createMeme(slug);
                } else {
                    // cannot upload
                    disableButton(false)
                }
            }
        };
        if (tempCanvas.toBlob) {
            tempCanvas.toBlob(function(blob) {
                    xhr.send(blob);
                },
                'image/jpeg'
            );
        } else {
            // cannot upload
            disableButton(false)
        }
    }

    function createMeme(slug) {
        var customTemplateName = null;
        var hidePost = $('#private-checkbox').is(":checked");
        if ($('#custom-template').is(":checked") && !hidePost) {
            customTemplateName = $("#templateName").val()
        }
        var category = $('#memeCategory').data("meme-category");
        $.ajax({
            url: '/uploads',
            type: 'POST',
            data: {
                text: memeText.trim(),
                hidden: hidePost,
                attribution: attributionInstance.getText(),
                category: category,
                customTemplateName: customTemplateName,
                slug: slug
            },
            success: function(data) {
                loadPage(slug, category);
            },
            error: function() {
                disableButton(false)
            }
        });
    }

    var increasingTimeout = 1000

    function loadPage(slug, category) {
        setTimeout(function() {
            checkIfMemeGenerated(slug, category)
        }, increasingTimeout);
        increasingTimeout = increasingTimeout + 1000;
    }

    function checkIfMemeGenerated(slug, category) {
        $.ajax({
            url: "/generated/" + slug,
            success: function() {
                if (ga) {
                    ga('send', 'event', 'meme_generated', 'web', category);
                }
                window.location.replace("/m/" + slug)
            },
            error: function() {
                loadPage(slug, category);
            }
        });
    }

    // Textarea

    $("#memeTextArea").keyup(function() {
        updateText($("#memeTextArea").val());
    });

    $("#attribution").keyup(function() {
        updateAttribution($("#attribution").val());
    });

    //Textarea height
    $('textarea').each(function() {
        this.setAttribute('style', 'height:' + (this.scrollHeight) + 'px;overflow-y:hidden;');
    }).on('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    function initText() {
        textInstance = new fabric.Textbox($('#memeTextArea').val(), {
            fontFamily: FONT_FAMILY,
            fontSize: FONT_SIZE,
            left: TEXT_HORIZONTAL_PADDING,
            top: IMAGE_PADDING,
            lockScalingX: true,
            background: "#FFF",
            width: canvas.width - 2 * TEXT_HORIZONTAL_PADDING
        });
        canvas.add(textInstance);
        canvas.renderAll();
    }

    function initAttribution(cb) {
        var logo = new Image();
        logo.src = "/images/surf_small.png";
        logo.onload = function() {
            attributionInstance = new fabric.Textbox($('#attribution').val(), {
                fontFamily: FONT_FAMILY,
                fontSize: ATTRIBUTION_FONT_SIZE,
                left: IMAGE_PADDING + ATTRIBUTION_SIDE_PADDING,
                textAlign: "left",
                width: canvas.width,
                fill: "#fff",
                shadow: "0 2px 4px rgba(50,40,177,0.6)",
                fontWeight: 300,
                height: 25
            });
            logoInstance = new fabric.Image(logo, {
                left: canvas.width - logo.width - IMAGE_PADDING - ATTRIBUTION_SIDE_PADDING,
                opacity: 0
            });
        };
    }

    function addAttributionToCanvas() {
        attributionShowing = true;
        logoInstance.opacity = 1;
        updateFabric();
    }

    var tempCanvas;

    function rotateImage(image, orientation, callback) {
        var width;
        var height;
        var x = 0;
        var y = 0;
        var degree = 0;
        var newImage = resizeImage(image);
        tempCanvas = document.createElement("canvas");
        if (orientation == 0) {
            return callback(image);
        } else if (orientation == 6) {
            width = image.height;
            height = image.width;
            y = image.height * (-1);
            degree = 90;
        } else if (orientation == 3) {
            width = image.width;
            height = image.height;
            x = image.width * (-1);
            y = image.height * (-1);
            degree = 180;
        } else if (orientation == 8) {
            width = image.height;
            height = image.width;
            x = image.width * (-1);
            degree = 270;
        } else {
            width = image.width;
            height = image.height;
        }
        tempCanvas.width = width;
        tempCanvas.height = height;
        var ctx = tempCanvas.getContext("2d");
        ctx.rotate(degree * Math.PI / 180);
        ctx.drawImage(image, x, y, newImage.width, newImage.height);
        var dataURL = tempCanvas.toDataURL('image/jpeg', 1.0);
        var returnImage = new Image();
        returnImage.src = dataURL;
        returnImage.onload = function() {
            return callback(this);
        };
    }

    function resizeImage(image) {
        var maxImageWidth = canvas.width;
        if (image.width > maxImageWidth) {
            image.height = image.height / image.width * 640;
            image.width = maxImageWidth;
        }
        return image
    }

});