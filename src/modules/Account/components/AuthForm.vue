<script setup lang="ts">
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Password from 'primevue/password'
import SelectButton from 'primevue/selectbutton'
import { computed, ref } from 'vue'
import { isValidName, isValidPassword } from '../composables/accountRules'
import { useAccount } from '../composables/useAccount'

const MODE_LOGIN = 'Вход'
const MODE_REGISTER = 'Регистрация'

const { registerMutation, loginMutation } = useAccount()

const mode = ref(MODE_REGISTER)
const name = ref('')
const password = ref('')
const password2 = ref('')

const isLogin = computed(() => mode.value === MODE_LOGIN)
const mutation = computed(() => (isLogin.value ? loginMutation : registerMutation))
const nameInvalid = computed(() => name.value !== '' && !isValidName(name.value))
const passwordInvalid = computed(() => password.value !== '' && !isValidPassword(password.value))
const passwordsDiffer = computed(() => password2.value !== '' && password2.value !== password.value)
const canSubmit = computed(
  () =>
    isValidName(name.value) &&
    isValidPassword(password.value) &&
    (isLogin.value || password2.value === password.value) &&
    !mutation.value.isPending.value,
)
const authError = computed(() => mutation.value.error.value?.message || (mutation.value.isError.value ? 'Неверное имя или пароль' : ''))

function submit() {
  if (canSubmit.value) mutation.value.mutate({ name: name.value.trim(), password: password.value })
}
</script>

<template>
  <form class="panel" @submit.prevent="submit">
    <h1>{{ isLogin ? 'С возвращением' : 'Создайте аккаунт' }}</h1>
    <SelectButton v-model="mode" :options="[MODE_LOGIN, MODE_REGISTER]" :allow-empty="false" style="align-self: center" />
    <div class="field">
      <label for="player-name">Имя игрока</label>
      <InputText id="player-name" v-model="name" :invalid="nameInvalid" autocomplete="username" />
      <Message :severity="nameInvalid ? 'error' : 'secondary'" size="small" variant="simple">
        {{ isLogin ? 'Имя, под которым вы регистрировались' : 'От 3 до 16 символов, его увидит соперник' }}
      </Message>
    </div>
    <div class="field">
      <label for="player-pass">Пароль</label>
      <Password
        v-model="password"
        input-id="player-pass"
        :feedback="!isLogin"
        toggle-mask
        fluid
        :invalid="passwordInvalid"
        prompt-label="Не короче 8 символов"
        weak-label="Слабый"
        medium-label="Средний"
        strong-label="Надёжный"
      />
      <Message v-if="!isLogin" :severity="passwordInvalid ? 'error' : 'secondary'" size="small" variant="simple">Не короче 8 символов</Message>
    </div>
    <div v-if="!isLogin" class="field">
      <label for="player-pass2">Повторите пароль</label>
      <Password v-model="password2" input-id="player-pass2" :feedback="false" toggle-mask fluid :invalid="passwordsDiffer" />
      <Message v-if="passwordsDiffer" severity="error" size="small" variant="simple">Пароли не совпадают</Message>
    </div>
    <Message v-if="authError" severity="error">{{ authError }}</Message>
    <Button type="submit" :label="isLogin ? 'Войти' : 'Зарегистрироваться'" :disabled="!canSubmit" />
  </form>
</template>
