<script setup lang='ts'>
import { calcLink, homeLink } from '@/router'
import Icon from '@c/core/Icon.vue'
import { mdiGithub } from '@mdi/js'
</script>
<template>
  <!-- Responsive navbar-->
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
    <div class="container px-5">
      <a class="navbar-brand"
         href="#!">📈ACB123</a>
      <button class="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarSupportedContent"
              aria-controls="navbarSupportedContent"
              aria-expanded="false"
              aria-label="Toggle navigation"><span class="navbar-toggler-icon"></span></button>
      <div class="collapse navbar-collapse"
           id="navbarSupportedContent">
        <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
          <li class="nav-item">
            <router-link class="nav-link"
                         :to="homeLink"
                         href="">Home</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link"
                         :to="calcLink"
                         href="#!">Calculator</router-link>
          </li>
          <li class="nav-item"><a class="nav-link"
               href="#!">Privacy</a></li>
          <li class="nav-item"><a class="nav-link"
               target="_blank"
               href="https://github.com/littledot/acb123">
              <Icon class="w-6 h-6 fill-white"
                    :path="mdiGithub" />
            </a></li>
        </ul>
      </div>
    </div>
  </nav>
</template>
<style scoped>
@import '@/start-bootstrap.css'
</style>
