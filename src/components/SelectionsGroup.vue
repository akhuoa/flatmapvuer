<template>
  <div class="selections-container">
    <el-row>
      <el-col :span="12">
        <span class="checkall-display-text">{{ title }}</span>
        <el-popover
          width="250"
          trigger="hover"
          :teleported="false"
          popper-class="popover-origin-help"
          v-if="helpMessage"
        >
        <template v-if="helpMessage" #reference>
          <el-icon class="info"><el-icon-warning /></el-icon>
        </template>
        <span style="word-break: keep-all">
          {{ helpMessage }}
        </span>
      </el-popover>
      </el-col>
      <el-col :span="12">
        <el-checkbox
          v-if="selections && selections.length > 1"
          class="all-checkbox"
          :indeterminate="isIndeterminate"
          v-model="checkAll"
          @change="handleCheckAllChange"
          @click="onAllCheckboxNativeChange"
          >Display all</el-checkbox
        >
      </el-col>
    </el-row>
    <el-checkbox-group
      v-model="checkedItems"
      size="small"
      class="checkbox-group"
      @change="handleCheckedItemsChange"
    >
      <div class="checkbox-group-inner">
        <el-row
          v-for="item in selections"
          :key="item[identifierKey]"
          :label="item[identifierKey]"
        >
          <div class="checkbox-container"
            @mouseenter="checkboxMouseEnterEmit(item[identifierKey], true)"
            @mouseleave="checkboxMouseEnterEmit(item[identifierKey], false)"
            >
            <el-checkbox
              class="my-checkbox"
              :label="item[identifierKey]"
              :value="item[identifierKey]"
              @change="visibilityToggle(item[identifierKey], $event)"
              @click="onCheckboxNativeChange"
              :checked="!('enabled' in item) || item.enabled === true"
            >
              <el-row class="checkbox-row">
                <el-col :span="4" v-if="hasLineStyles(item)">
                  <div class="path-visual" :style="getLineStyles(item)"></div>
                </el-col>
                <el-col :span="20">
                  <div :style="getBackgroundStyles(item)">
                    {{ item[labelKey] }}
                  </div>
                </el-col>
              </el-row>
            </el-checkbox>
          </div>
        </el-row>
      </div>
    </el-checkbox-group>
  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import {
  Warning as ElIconWarning,
} from '@element-plus/icons-vue'
import {
  ElCheckbox as Checkbox,
  ElCheckboxGroup as CheckboxGroup,
  ElIcon as Icon,
  ElCol as Col,
  ElRow as Row,
} from 'element-plus'

export default {
  name: 'SelectionsGroup',
  components: {
    Checkbox,
    CheckboxGroup,
    Col,
    Icon,
    Row,
    ElIconWarning,
  },
  methods: {
    /**
     * Function to toggle paths to default.
     * Also called when the associated button is pressed.
     */
    reset: function () {
      this.checkAll = true
      this.checkedItems = []
      this.selections.forEach((item) => {
        if (!('enabled' in item) || item.enabled === true) {
          this.checkedItems.push(item[this.identifierKey])
        } else {
          this.checkAll = false
        }
      })
    },
    setCheckboxActionData: function (containerEl, option) {
      // option = 'individual' or 'all'
      if (containerEl) {
        const checkboxEl = containerEl.querySelector('input[type="checkbox"]');
        const checkboxLabelEl = containerEl.querySelector('.el-checkbox__label');
        const selectionsContainerEl = containerEl.closest('.selections-container');
        const selectionsTitleEl = selectionsContainerEl.querySelector('.checkall-display-text');

        // change true/false to checked/unchecked for readability
        let checkedLabel = '';
        if (checkboxEl) {
          checkedLabel = checkboxEl.checked ? 'checked' : 'unchecked';
        }

        this.checkboxActionData = {
          selectionsTitle: selectionsTitleEl ? selectionsTitleEl.innerText : '',
          property: (checkboxEl && option !== 'all') ? checkboxEl.value : '',
          label: checkboxLabelEl ? checkboxLabelEl.innerText : '',
          checked: checkedLabel
        };
      } else {
        // reset if no checkbox container found
        this.checkboxActionData = {
          selectionsTitle: '',
          property: '',
          label: '',
          checked: '',
        };
      }
    },
    onCheckboxNativeChange: function (event) {
      const checkboxContainerEl = event.target.closest('.checkbox-container');
      this.setCheckboxActionData(checkboxContainerEl, 'individual');
    },
    onAllCheckboxNativeChange: function (event) {
      const checkboxContainerEl = event.target.closest('.all-checkbox');
      this.setCheckboxActionData(checkboxContainerEl, 'all');
    },
    visibilityToggle: function (key, value) {
      this.$emit('changed', { key, value })
      // emit event with checkbox data for tracking
      if (key === this.checkboxActionData.property) {
        // change true/false to checked/unchecked for readability
        this.checkboxActionData.checked = value ? 'checked' : 'unchecked';
      }
      this.$emit('selections-data-changed', this.checkboxActionData);
    },
    checkboxMouseEnterEmit: function (key, value) {
      // Update the stated to send to the emit
      this.$emit('checkboxMouseEnter', { key: key, value: value, selections: this.selections, checked: this.checkedItems})
    },
    handleCheckedItemsChange: function (value) {
      let checkedCount = value.length
      this.checkAll = checkedCount === this.selections.length
    },
    handleCheckAllChange: function (val) {
      this.checkedItems = val
        ? this.selections.map((a) => a[this.identifierKey])
        : []

      this.$emit('checkAll', {
        keys: this.selections.map((a) => a[this.identifierKey]),
        value: val,
      })
      // emit event with checkbox data for tracking
      this.checkboxActionData.property = this.identifierKey;
      // change true/false to checked/unchecked for readability
      this.checkboxActionData.checked = val ? 'checked' : 'unchecked';
      this.$emit('selections-data-changed', this.checkboxActionData);
    },
    getBackgroundStyles: function (item) {
      if ('colour' in item && this.colourStyle === 'background') {
        return { background: item.colour }
      }
      return {}
    },
    getState: function() {
      let checkedCount = this.checkedItems.length
      const checkAll = checkedCount === this.selections.length
      return {
        checkAll,
        checked: !checkAll ? this.checkedItems : []
      }
    },
    setState: function(state) {
      this.checkAll = state.checkAll
      this.checkedItems.length = 0
      if (state.checked?.length) {
        this.checkedItems.push(...state.checked)
        this.selections.forEach((item) => {
          const key = item[this.identifierKey]
          this.$emit('changed', {key, value: this.checkedItems.includes(key)})
        })
      } else {
        const keys = this.selections.map((a) => a[this.identifierKey])
        let value = false
        if (this.checkAll) {
          value = true
          this.checkedItems.push(...keys)
        }
        this.$emit('checkAll', { keys, value })
      }
    },
    hasLineStyles: function(item) {
      return 'colour' in item && this.colourStyle === 'line'
    },
    getLineStyles: function (item) {
      if ('colour' in item && this.colourStyle === 'line') {
        if ('dashed' in item && item.dashed === true) {
          const background = `repeating-linear-gradient(90deg,${item.colour},${item.colour} 6px,transparent 0,transparent 9px)`
          return { background }
        } else {
          return { background: item.colour }
        }
      }
      return { display: 'None' }
    },
  },
  props: {
    colourStyle: {
      type: String,
      default: 'line',
    },
    helpMessage: {
      type: String,
      default: '',
    },
    identifierKey: {
      type: String,
      default: 'id',
    },
    labelKey: {
      type: String,
      default: 'label',
    },
    title: {
      type: String,
      default: '',
    },
    selections: {
      type: Array,
      default: function () {
        return []
      },
    },
  },
  computed: {
    isIndeterminate: function () {
      const count = this.checkedItems.length
      if (count === 0 || this.checkAll) {
        return false
      }
      return true
    },
  },
  data: function () {
    return {
      checkedItems: [],
      checkAll: true,
      checkboxActionData: {
        selectionsTitle: '',
        property: '',
        label: '',
        checked: '',
      },
    }
  },
  mounted: function () {
    this.reset()
  },
}
</script>

<style lang="scss" scoped>

.path-visual {
  margin: 3px 0;
  height: 3px;
  width: 25px;
  margin-right: 5px;
  display: inline-block;
}

.selections-container {
  padding-top: 5px;
}

.checkall-display-text {
  width: 59px;
  height: 20px;
  color: rgb(48, 49, 51);
  font-size: 14px;
  font-weight: normal;
  line-height: 20px;
  margin-left: 8px;
  white-space: nowrap;
}

.all-checkbox {
  height:20px;
  float: right;
}

.checkbox-container {
  display: flex;
  cursor: pointer;
  width: 100%;
}

.checkbox-group {
  width: 260px;
  border: 1px solid rgb(144, 147, 153);
  border-radius: 4px;
  background: #ffffff;
}

.my-checkbox {
  background-color: #fff;
  width: 100%;
}

.checkbox-group-inner {
  padding: 18px;
}

:deep(.el-checkbox__label) {
  padding-left: 5px;
  color: inherit !important;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0px;
  line-height: 14px;
  width: 100%;
}

:deep(.el-checkbox__input) {
  &.is-indeterminate,
  &.is-checked {
    .el-checkbox__inner {
      background-color: $app-primary-color;
      border-color: $app-primary-color;
    }
  }
}

:deep(.el-row) {
  height:20px;
  margin-bottom: 0;
}

.checkbox-row {
  width: 100%;
  top: 2px;
}

.info {
  transform: rotate(180deg);
  color: #8300bf;
  margin-left: 8px;
}


:deep(.popover-origin-help.el-popover) {
  text-transform: none !important; // need to overide the tooltip text transform
  border: 1px solid $app-primary-color;
  .el-popper__arrow {
    &:before {
      border-color: $app-primary-color;
      background-color: #ffffff;
    }
  }
}
</style>
