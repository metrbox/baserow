import Vue from 'vue'

import Context from '@baserow/modules/core/components/Context'
import Modal from '@baserow/modules/core/components/Modal'
import Editable from '@baserow/modules/core/components/Editable'
import Dropdown from '@baserow/modules/core/components/Dropdown'
import DropdownItem from '@baserow/modules/core/components/DropdownItem'
import Picker from '@baserow/modules/core/components/Picker'
import ProgressBar from '@baserow/modules/core/components/ProgressBar'
import Checkbox from '@baserow/modules/core/components/Checkbox'
import Radio from '@baserow/modules/core/components/Radio'
import Scrollbars from '@baserow/modules/core/components/Scrollbars'
import Error from '@baserow/modules/core/components/Error'
import SwitchInput from '@baserow/modules/core/components/SwitchInput'
import Copied from '@baserow/modules/core/components/Copied'
import MarkdownIt from '@baserow/modules/core/components/MarkdownIt'
import DownloadLink from '@baserow/modules/core/components/DownloadLink'
import FormElement from '@baserow/modules/core/components/FormElement'
import Alert from '@baserow/modules/core/components/Alert'
import Tabs from '@baserow/modules/core/components/Tabs'
import Tab from '@baserow/modules/core/components/Tab'
import List from '@baserow/modules/core/components/List'
import HelpIcon from '@baserow/modules/core/components/HelpIcon'
import Button from '@baserow/modules/core/components/Button'
import Avatar from '@baserow/modules/core/components/Avatar'
import Presentation from '@baserow/modules/core/components/Presentation'
import FormInput from '@baserow/modules/core/components/FormInput'
import CallToAction from '@baserow/modules/core/components/CallToAction.vue'
import FormGroup from '@baserow/modules/core/components/FormGroup'
import FormRow from '@baserow/modules/core/components/FormRow'

import lowercase from '@baserow/modules/core/filters/lowercase'
import uppercase from '@baserow/modules/core/filters/uppercase'
import nameAbbreviation from '@baserow/modules/core/filters/nameAbbreviation'

import scroll from '@baserow/modules/core/directives/scroll'
import preventParentScroll from '@baserow/modules/core/directives/preventParentScroll'
import tooltip from '@baserow/modules/core/directives/tooltip'
import sortable from '@baserow/modules/core/directives/sortable'
import autoOverflowScroll from '@baserow/modules/core/directives/autoOverflowScroll'
import userFileUpload from '@baserow/modules/core/directives/userFileUpload'
import autoScroll from '@baserow/modules/core/directives/autoScroll'
import clickOutside from '@baserow/modules/core/directives/clickOutside'
import Badge from '@baserow/modules/core/components/Badge'
import Expandable from '@baserow/modules/core/components/Expandable.vue'
import RadioButton from '@baserow/modules/core/components/RadioButton'
import Thumbnail from '@baserow/modules/core/components/Thumbnail'
import ColorInput from '@baserow/modules/core/components/ColorInput'
import ColorInputGroup from '@baserow/modules/core/components/ColorInputGroup'

function setupVue(Vue) {
  Vue.component('Context', Context)
  Vue.component('Modal', Modal)
  Vue.component('Editable', Editable)
  Vue.component('Dropdown', Dropdown)
  Vue.component('DropdownItem', DropdownItem)
  Vue.component('Checkbox', Checkbox)
  Vue.component('Radio', Radio)
  Vue.component('Scrollbars', Scrollbars)
  Vue.component('Alert', Alert)
  Vue.component('Error', Error)
  Vue.component('SwitchInput', SwitchInput)
  Vue.component('Copied', Copied)
  Vue.component('MarkdownIt', MarkdownIt)
  Vue.component('DownloadLink', DownloadLink)
  Vue.component('FormElement', FormElement)
  Vue.component('Picker', Picker)
  Vue.component('ProgressBar', ProgressBar)
  Vue.component('Tab', Tab)
  Vue.component('Tabs', Tabs)
  Vue.component('List', List)
  Vue.component('HelpIcon', HelpIcon)
  Vue.component('Badge', Badge)
  Vue.component('Expandable', Expandable)
  Vue.component('Button', Button)
  Vue.component('RadioButton', RadioButton)
  Vue.component('Thumbnail', Thumbnail)
  Vue.component('Avatar', Avatar)
  Vue.component('Presentation', Presentation)
  Vue.component('FormInput', FormInput)
  Vue.component('CallToAction', CallToAction)
  Vue.component('FormGroup', FormGroup)
  Vue.component('FormRow', FormRow)
  Vue.component('ColorInput', ColorInput)
  Vue.component('ColorInputGroup', ColorInputGroup)

  Vue.filter('lowercase', lowercase)
  Vue.filter('uppercase', uppercase)
  Vue.filter('nameAbbreviation', nameAbbreviation)

  Vue.directive('scroll', scroll)
  Vue.directive('preventParentScroll', preventParentScroll)
  Vue.directive('tooltip', tooltip)
  Vue.directive('sortable', sortable)
  Vue.directive('autoOverflowScroll', autoOverflowScroll)
  Vue.directive('userFileUpload', userFileUpload)
  Vue.directive('autoScroll', autoScroll)
  Vue.directive('clickOutside', clickOutside)

  Vue.prototype.$super = function (options) {
    return new Proxy(options, {
      get: (options, name) => {
        if (options.methods && name in options.methods) {
          return options.methods[name].bind(this)
        }
      },
    })
  }
}

setupVue(Vue)

export { setupVue }
