/**
* Module/App: Main Js
*/


!function($) {
    "use strict";

    var Navbar = function() {};

    //navbar - topbar
    Navbar.prototype.init = function () {
      //toggle
      $('.navbar-toggle').on('click', function (event) {
        $(this).toggleClass('open');
        $('#navigation').slideToggle(400);
        $('.cart, .search').removeClass('open');
      });

      $('.navigation-menu>li').slice(-1).addClass('last-elements');

      $('.navigation-menu li.has-submenu a[href="#"]').on('click', function (e) {
        if ($(window).width() < 992) {
          e.preventDefault();
          $(this).parent('li').toggleClass('open').find('.submenu:first').toggleClass('open');
        }
      });

      $(".right-bar-toggle").click(function(){
        $(".right-bar").toggle();
        $('.wrapper').toggleClass('right-bar-enabled');
      });
    },
    //init
    $.Navbar = new Navbar, $.Navbar.Constructor = Navbar
}(window.jQuery),

//initializing
(function() {
    "use strict";
    $.Navbar.init();

    $('#print').on('click', function(){
      window.print();
    });

    $('a.delete').on('click', function (e) {
      e.preventDefault();
      var href = this.href;

        swal({
            title: "Are you sure?",
            text: "You will not be able to recover this entry!",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ff5b5b",
            confirmButtonText: "Yes, delete it!",
            closeOnConfirm: false
        }, function () {
            location.href = href;
        });

        return false;
    });

    $('.dropify').dropify({
        messages: {
            'default': 'Drag and drop a file here or click',
            'replace': 'Drag and drop or click to replace',
            'remove': 'Remove',
            'error': 'Ooops, something wrong appended.'
        },
        error: {
            'fileSize': 'The file size is too big (1M max).'
        }
    });

    $('#datepicker').datepicker({
        autoclose: true,
        todayHighlight: true
    });
        

    $('#date-range').datepicker({
        toggleActive: true,
        format: 'dd/mm/yyyy'
    });

    $('a.customRange').on('click', function(e) {
      $('.toggleTitle').html('Custom');
      $('.customRangeForm').css('display', 'inline-block');
    });

})();



