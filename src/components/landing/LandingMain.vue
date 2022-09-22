<script setup lang='ts'>
import * as v from 'vue'
import * as u from '@m/util'
import NavBar from '@c/Nav.vue'
import Icon from '@c/core/Icon.vue'
import { mdiGithub, mdiFinance, mdiDatabaseLock } from '@mdi/js'

let props = defineProps<{
  modelValue?: any
}>()
let emits = defineEmits({
  'update:modelValue': (it: any) => true,
})

</script>
<template>
  <!-- Responsive navbar-->
  <NavBar />
  <!-- Header-->
  <header class="bg-dark py-5">
    <div class="container px-5">
      <div class="row gx-5 justify-content-center">
        <div class="col-lg-6">
          <div class="text-center my-5">
            <h1 class="display-5 fw-bolder text-white mb-2">Calculate T5008 Adjusted Cost Base & Capital Gains with ease
            </h1>
            <p class="lead text-white-50 mb-4">Directly import trade history from brokers and ACB123 will
              compute ACB & Capital Gains for every trade. Spend less time logging trades and more time trading.</p>
            <div class="d-grid gap-3 d-sm-flex justify-content-sm-center">
              <router-link :to="{name:'calc'}"
                           class="btn btn-primary btn-lg px-4 me-sm-3">
                Get Started
              </router-link>
              <a class="btn btn-outline-light btn-lg px-4"
                 target="_blank"
                 href="https://github.com/littledot/acb123">
                View Source Code
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
  <!-- Features section-->
  <section class="py-5 border-bottom"
           id="features">
    <div class="container px-5 my-5">
      <div class="row gx-5">
        <div class="col-lg-4 mb-5 mb-lg-0">
          <div class="feature bg-primary bg-gradient text-white rounded-3 mb-3">
            <Icon class="w-full h-full p-1 fill-white"
                  :path="mdiDatabaseLock" />
          </div>
          <h2 class="h4 fw-bolder">Your Data, Local Only</h2>
          <p>We do not collect any trade data.
            Calculations are all done locally in your browser and stored locally in your browser.
            You can delete them anytime you want.
          </p>
          <a v-if="false"
             class="text-decoration-none"
             href="#!">
            Call to action
            <i class="bi bi-arrow-right"></i>
          </a>
        </div>
        <div class="col-lg-4 mb-5 mb-lg-0">
          <div class="feature bg-primary bg-gradient text-white rounded-3 mb-3">

            <Icon class="w-full h-full p-1 fill-white"
                  :path="mdiFinance" />
          </div>
          <h2 class="h4 fw-bolder">Import Data in Bulk</h2>
          <p>Frequent traders can import trade data from brokers by uploading trade confirmation CSV files. Questrade
            and Interactive Brokers formats are supported.</p>
          <a v-if="false"
             class="text-decoration-none"
             href="#!">
            Call to action
            <i class="bi bi-arrow-right"></i>
          </a>
        </div>
        <div class="col-lg-4">
          <div class="feature bg-primary bg-gradient text-white rounded-3 mb-3">
            <Icon class="w-full h-full p-1 fill-white"
                  :path="mdiGithub" />
          </div>
          <h2 class="h4 fw-bolder">Free and Open Source</h2>
          <p>Completely free for all. Source code is also available for your viewing pleasure.</p>
          <a v-if="false"
             class="text-decoration-none"
             href="#!">
            Call to action
            <i class="bi bi-arrow-right"></i>
          </a>
        </div>
      </div>
    </div>
  </section>
  <template v-if="false">
    <!-- Pricing section-->
    <section class="bg-light py-5 border-bottom">
      <div class="container px-5 my-5">
        <div class="text-center mb-5">
          <h2 class="fw-bolder">Pay as you grow</h2>
          <p class="lead mb-0">With our no hassle pricing plans</p>
        </div>
        <div class="row gx-5 justify-content-center">
          <!-- Pricing card free-->
          <div class="col-lg-6 col-xl-4">
            <div class="card mb-5 mb-xl-0">
              <div class="card-body p-5">
                <div class="small text-uppercase fw-bold text-muted">Free</div>
                <div class="mb-3">
                  <span class="display-4 fw-bold">$0</span>
                  <span class="text-muted">/ mo.</span>
                </div>
                <ul class="list-unstyled mb-4">
                  <li class="mb-2">
                    <i class="bi bi-check text-primary"></i>
                    <strong>1 users</strong>
                  </li>
                  <li class="mb-2">
                    <i class="bi bi-check text-primary"></i>
                    5GB storage
                  </li>
                  <li class="mb-2">
                    <i class="bi bi-check text-primary"></i>
                    Unlimited public projects
                  </li>
                  <li class="mb-2">
                    <i class="bi bi-check text-primary"></i>
                    Community access
                  </li>
                  <li class="mb-2 text-muted">
                    <i class="bi bi-x"></i>
                    Unlimited private projects
                  </li>
                  <li class="mb-2 text-muted">
                    <i class="bi bi-x"></i>
                    Dedicated support
                  </li>
                  <li class="mb-2 text-muted">
                    <i class="bi bi-x"></i>
                    Free linked domain
                  </li>
                  <li class="text-muted">
                    <i class="bi bi-x"></i>
                    Monthly status reports
                  </li>
                </ul>
                <div class="d-grid"><a class="btn btn-outline-primary"
                     href="#!">Choose plan</a></div>
              </div>
            </div>
          </div>
          <!-- Pricing card pro-->
          <div class="col-lg-6 col-xl-4">
            <div class="card mb-5 mb-xl-0">
              <div class="card-body p-5">
                <div class="small text-uppercase fw-bold">
                  <i class="bi bi-star-fill text-warning"></i>
                  Pro
                </div>
                <div class="mb-3">
                  <span class="display-4 fw-bold">$9</span>
                  <span class="text-muted">/ mo.</span>
                </div>
                <ul class="list-unstyled mb-4">
                  <li class="mb-2">
                    <i class="bi bi-check text-primary"></i>
                    <strong>5 users</strong>
                  </li>
                  <li class="mb-2">
                    <i class="bi bi-check text-primary"></i>
                    5GB storage
                  </li>
                  <li class="mb-2">
                    <i class="bi bi-check text-primary"></i>
                    Unlimited public projects
                  </li>
                  <li class="mb-2">
                    <i class="bi bi-check text-primary"></i>
                    Community access
                  </li>
                  <li class="mb-2">
                    <i class="bi bi-check text-primary"></i>
                    Unlimited private projects
                  </li>
                  <li class="mb-2">
                    <i class="bi bi-check text-primary"></i>
                    Dedicated support
                  </li>
                  <li class="mb-2">
                    <i class="bi bi-check text-primary"></i>
                    Free linked domain
                  </li>
                  <li class="text-muted">
                    <i class="bi bi-x"></i>
                    Monthly status reports
                  </li>
                </ul>
                <div class="d-grid"><a class="btn btn-primary"
                     href="#!">Choose plan</a></div>
              </div>
            </div>
          </div>
          <!-- Pricing card enterprise-->
          <div class="col-lg-6 col-xl-4">
            <div class="card">
              <div class="card-body p-5">
                <div class="small text-uppercase fw-bold text-muted">Enterprise</div>
                <div class="mb-3">
                  <span class="display-4 fw-bold">$49</span>
                  <span class="text-muted">/ mo.</span>
                </div>
                <ul class="list-unstyled mb-4">
                  <li class="mb-2">
                    <i class="bi bi-check text-primary"></i>
                    <strong>Unlimited users</strong>
                  </li>
                  <li class="mb-2">
                    <i class="bi bi-check text-primary"></i>
                    5GB storage
                  </li>
                  <li class="mb-2">
                    <i class="bi bi-check text-primary"></i>
                    Unlimited public projects
                  </li>
                  <li class="mb-2">
                    <i class="bi bi-check text-primary"></i>
                    Community access
                  </li>
                  <li class="mb-2">
                    <i class="bi bi-check text-primary"></i>
                    Unlimited private projects
                  </li>
                  <li class="mb-2">
                    <i class="bi bi-check text-primary"></i>
                    Dedicated support
                  </li>
                  <li class="mb-2">
                    <i class="bi bi-check text-primary"></i>
                    <strong>Unlimited</strong>
                    linked domains
                  </li>
                  <li class="text-muted">
                    <i class="bi bi-check text-primary"></i>
                    Monthly status reports
                  </li>
                </ul>
                <div class="d-grid"><a class="btn btn-outline-primary"
                     href="#!">Choose plan</a></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <!-- Testimonials section-->
    <section class="py-5 border-bottom">
      <div class="container px-5 my-5 px-5">
        <div class="text-center mb-5">
          <h2 class="fw-bolder">Customer testimonials</h2>
          <p class="lead mb-0">Our customers love working with us</p>
        </div>
        <div class="row gx-5 justify-content-center">
          <div class="col-lg-6">
            <!-- Testimonial 1-->
            <div class="card mb-4">
              <div class="card-body p-4">
                <div class="d-flex">
                  <div class="flex-shrink-0"><i class="bi bi-chat-right-quote-fill text-primary fs-1"></i></div>
                  <div class="ms-4">
                    <p class="mb-1">Thank you for putting together such a great product. We loved working with you and
                      the whole team, and we will be recommending you to others!</p>
                    <div class="small text-muted">- Client Name, Location</div>
                  </div>
                </div>
              </div>
            </div>
            <!-- Testimonial 2-->
            <div class="card">
              <div class="card-body p-4">
                <div class="d-flex">
                  <div class="flex-shrink-0"><i class="bi bi-chat-right-quote-fill text-primary fs-1"></i></div>
                  <div class="ms-4">
                    <p class="mb-1">The whole team was a huge help with putting things together for our company and
                      brand. We will be hiring them again in the near future for additional work!</p>
                    <div class="small text-muted">- Client Name, Location</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <!-- Contact section-->
    <section class="bg-light py-5">
      <div class="container px-5 my-5 px-5">
        <div class="text-center mb-5">
          <div class="feature bg-primary bg-gradient text-white rounded-3 mb-3"><i class="bi bi-envelope"></i></div>
          <h2 class="fw-bolder">Get in touch</h2>
          <p class="lead mb-0">We'd love to hear from you</p>
        </div>
        <div class="row gx-5 justify-content-center">
          <div class="col-lg-6">
            <!-- * * * * * * * * * * * * * * *-->
            <!-- * * SB Forms Contact Form * *-->
            <!-- * * * * * * * * * * * * * * *-->
            <!-- This form is pre-integrated with SB Forms.-->
            <!-- To make this form functional, sign up at-->
            <!-- https://startbootstrap.com/solution/contact-forms-->
            <!-- to get an API token!-->
            <form id="contactForm"
                  data-sb-form-api-token="API_TOKEN">
              <!-- Name input-->
              <div class="form-floating mb-3">
                <input class="form-control"
                       id="name"
                       type="text"
                       placeholder="Enter your name..."
                       data-sb-validations="required" />
                <label for="name">Full name</label>
                <div class="invalid-feedback"
                     data-sb-feedback="name:required">A name is required.</div>
              </div>
              <!-- Email address input-->
              <div class="form-floating mb-3">
                <input class="form-control"
                       id="email"
                       type="email"
                       placeholder="name@example.com"
                       data-sb-validations="required,email" />
                <label for="email">Email address</label>
                <div class="invalid-feedback"
                     data-sb-feedback="email:required">An email is required.</div>
                <div class="invalid-feedback"
                     data-sb-feedback="email:email">Email is not valid.</div>
              </div>
              <!-- Phone number input-->
              <div class="form-floating mb-3">
                <input class="form-control"
                       id="phone"
                       type="tel"
                       placeholder="(123) 456-7890"
                       data-sb-validations="required" />
                <label for="phone">Phone number</label>
                <div class="invalid-feedback"
                     data-sb-feedback="phone:required">A phone number is required.</div>
              </div>
              <!-- Message input-->
              <div class="form-floating mb-3">
                <textarea class="form-control"
                          id="message"
                          type="text"
                          placeholder="Enter your message here..."
                          style="height: 10rem"
                          data-sb-validations="required"></textarea>
                <label for="message">Message</label>
                <div class="invalid-feedback"
                     data-sb-feedback="message:required">A message is required.</div>
              </div>
              <!-- Submit success message-->
              <!---->
              <!-- This is what your users will see when the form-->
              <!-- has successfully submitted-->
              <div class="d-none"
                   id="submitSuccessMessage">
                <div class="text-center mb-3">
                  <div class="fw-bolder">Form submission successful!</div>
                  To activate this form, sign up at
                  <br />
                  <a
                     href="https://startbootstrap.com/solution/contact-forms">https://startbootstrap.com/solution/contact-forms</a>
                </div>
              </div>
              <!-- Submit error message-->
              <!---->
              <!-- This is what your users will see when there is-->
              <!-- an error submitting the form-->
              <div class="d-none"
                   id="submitErrorMessage">
                <div class="text-center text-danger mb-3">Error sending message!</div>
              </div>
              <!-- Submit Button-->
              <div class="d-grid"><button class="btn btn-primary btn-lg disabled"
                        id="submitButton"
                        type="submit">Submit</button></div>
            </form>
          </div>
        </div>
      </div>
    </section>
  </template>

  <!-- Footer-->
  <footer class="py-5 bg-dark">
    <div class="container px-5">
      <p class="m-0 text-center text-white">Copyright &copy; ACB123 2022</p>
    </div>
  </footer>
</template>
<style scoped>
@import '@/start-bootstrap.css'
</style>
  