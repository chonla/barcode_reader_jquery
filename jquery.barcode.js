/*
 * Barcode detector jQuery plugin customized for TMX
 * Author: Chonlasith Jucksriporn
 * Release:
 * June 7, 2013
 *  - Initial release.
 * June 11, 2013
 *  - Fix for old scanner.
 * June 11, 2013
 *  - Fix for old scanner.
 *  - Prevent callback if no barcode detected.
 * July 18, 2013
 *  - Make plugin chainable.
 * July 19, 2013
 *  - Prevent form submission on Enter detected.
 * September 26, 2013
 *  - Debug feature is added.
 *  - Fix reading problem in some barcode reader.
 * December 1, 2013
 *  - Fix reading problem in Metrologic barcode reader.
 *  - JSLint compatible.
 * -----------------------------------------------
 * How to use
 * $(selector).barcode(options);
 *
 * Options:
 * options is written in JSON format with the following options
 * timeout : Time (millisecond) to start detection once barcode is scanned.
 * onbarcode : The callback function when a barcode is detected in selector.
 * debug : Debug flag (default=false).
 *
 * Parameters sent to callback:
 * target : HTML element invoking the event.
 * barcode : Barcode detected.
 * segments : Segmented barcode delimited in array.
 */
/*global $, jQuery*/
(function ($) {
  'use strict';
  $.fn.barcode = function (options) {
    /*
    * options
    *  - timeout : timeout to detect barcode in millisecond
    *  - replacement : replacement pattern
    *  - debug : debug flag
    * */
    var def_options = {
      'timeout' : 1000,
      'replacement' : [
        [/#_16_##_220_#/, '|'],
        [/#_220_##_16_#/, '|'],
        [/#_17_##_77_#/g, ' '],
        [/#_17_##_86_#/g, '@CtrlV@'],  // Ctrl+V
        [/#_86_##_17_#/g, '@CtrlV@'],  // Ctrl+V
        [/#_16_##_45_#/g, '@CtrlV@'],  // Shift+Ins
        [/#_45_##_16_#/g, '@CtrlV@'],  // Shift+Ins
        [/#_13_#/g, ' '],  // Enter
        [/#_(\d+)_#/g, function (match, $1, $2, offset, original) { return String.fromCharCode($1); }]
      ],
      'debug' : false
    };

    var write_log = function (msg, type) {
      if (options.debug && console && console.log) {
        console.log('[' + type + '] ' + msg);
      }
    };

    options = $.extend(def_options, options);

    $(this)
      .on('click', function () {
        write_log('Click', 'EVENT');
        $(this).select();
      })
      .on('keyup', function (e) {
        var charCode = e.which;
        if ((96 <= charCode) && (charCode <= 105)) {
          // Fix for MetroLogic Barcode Scanner
          charCode -= 48;
        }
        var char = String.fromCharCode(charCode);

        write_log('KeyUp', 'EVENT');
        write_log('CharCode=' + charCode, 'INFO');
        var $bar = $(this);
        $bar.data('bar', ($bar.data('bar') === undefined ? '' : $bar.data('bar')));

        var bar_temp = $bar.data('bar');
        bar_temp += '#_' + charCode + '_#';
        $bar.data('bar', bar_temp);

        var ctimer = ($(this).data('timer') === undefined ? 0 : $(this).data('timer'));
        if (ctimer !== 0) {
          clearTimeout(ctimer);
          $(this).data('timer', 0);
        }
        var timer = setTimeout(function () {
          // Detect barcode
          var bar_temp = $bar.data('bar');
          var r;
          for (r in options.replacement) {
            if (options.replacement.hasOwnProperty(r)) {
              bar_temp = bar_temp.replace(options.replacement[r][0], options.replacement[r][1]);
            }
          }
          if (bar_temp === '@CtrlV@') {  // Control-V assumed
            bar_temp = $bar.val().replace(/(\r\n|\n|\r)/g, ' ');
          }
          bar_temp = bar_temp.replace(/@CtrlV@/g, '');  // Clean Up
          bar_temp = bar_temp.replace(/^\s+/, '').replace(/\s+$/, '');

          if (bar_temp.length > 1) {
            var segments = bar_temp.split(' ');
            if ($.isFunction(options.onbarcode)) {
              write_log('Callback onBarcode()', 'INFO');
              write_log('Read barcode' + segments, 'INFO');
              options.onbarcode($bar[0], bar_temp, segments);
            }
          }
          $bar.val('');
          $bar.data('bar', '');
        }, options.timeout);
        $(this).data('timer', timer);
        return true;
      })
      .on('keydown', function (e) {
        // Prevent form submission
        if (e.which === 13) {
          return false;
        }
        return true;
      });

    write_log('Initialize', 'EVENT');
    return this;
  };
}(jQuery));