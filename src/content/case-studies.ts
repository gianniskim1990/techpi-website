import type { ManagedCaseStudy } from './case-study-loader';
import rocketeer from '../../content/case-studies/rocketeer/index.json';
import armans from '../../content/case-studies/armans/index.json';
import logotherapiaXanthi from '../../content/case-studies/logotherapia-xanthi/index.json';
import levelUpEducationApp from '../../content/case-studies/level-up-education-app/index.json';
import saloon from '../../content/case-studies/saloon/index.json';
import physio from '../../content/case-studies/physio/index.json';
import project4you from '../../content/case-studies/project4you/index.json';
import rantevo from '../../content/case-studies/rantevo/index.json';
import mavie from '../../content/case-studies/mavie/index.json';
import iliastech from '../../content/case-studies/iliastech/index.json';
import alexandraApartment from '../../content/case-studies/alexandra-apartment/index.json';
import blackjackStreetwear from '../../content/case-studies/blackjack-streetwear/index.json';
import levelUpEducation from '../../content/case-studies/level-up-education/index.json';
import itsallaboutxanthi from '../../content/case-studies/itsallaboutxanthi/index.json';
import localXanthi from '../../content/case-studies/local-xanthi/index.json';
import julietteCoffeeRoasters from '../../content/case-studies/juliette-coffee-roasters/index.json';
import apoxFc from '../../content/case-studies/apox-fc/index.json';
import emoved from '../../content/case-studies/emoved/index.json';

/**
 * The 18 case studies, managed in the admin (Task M1B). One file each: content/case-studies/<slug>/index.json. The list is
 * explicit on purpose: a file is published only when it is listed here, and the admin Worker allows exactly these slugs.
 * The order of this list does not matter: the Work-page order is each file's locked `facts.order`.
 */
export const managedCaseStudies: readonly { slug: string; doc: ManagedCaseStudy }[] = [
  { slug: 'rocketeer', doc: rocketeer as unknown as ManagedCaseStudy },
  { slug: 'armans', doc: armans as unknown as ManagedCaseStudy },
  { slug: 'logotherapia-xanthi', doc: logotherapiaXanthi as unknown as ManagedCaseStudy },
  { slug: 'level-up-education-app', doc: levelUpEducationApp as unknown as ManagedCaseStudy },
  { slug: 'saloon', doc: saloon as unknown as ManagedCaseStudy },
  { slug: 'physio', doc: physio as unknown as ManagedCaseStudy },
  { slug: 'project4you', doc: project4you as unknown as ManagedCaseStudy },
  { slug: 'rantevo', doc: rantevo as unknown as ManagedCaseStudy },
  { slug: 'mavie', doc: mavie as unknown as ManagedCaseStudy },
  { slug: 'iliastech', doc: iliastech as unknown as ManagedCaseStudy },
  { slug: 'alexandra-apartment', doc: alexandraApartment as unknown as ManagedCaseStudy },
  { slug: 'blackjack-streetwear', doc: blackjackStreetwear as unknown as ManagedCaseStudy },
  { slug: 'level-up-education', doc: levelUpEducation as unknown as ManagedCaseStudy },
  { slug: 'itsallaboutxanthi', doc: itsallaboutxanthi as unknown as ManagedCaseStudy },
  { slug: 'local-xanthi', doc: localXanthi as unknown as ManagedCaseStudy },
  { slug: 'juliette-coffee-roasters', doc: julietteCoffeeRoasters as unknown as ManagedCaseStudy },
  { slug: 'apox-fc', doc: apoxFc as unknown as ManagedCaseStudy },
  { slug: 'emoved', doc: emoved as unknown as ManagedCaseStudy },
];
