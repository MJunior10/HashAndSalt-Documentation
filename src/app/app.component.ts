import {Component, HostListener, OnInit} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UsuarioControllerService } from './api/services/usuario-controller.service'
import crypto from 'crypto-js';
import {UsuarioDto} from './api/models'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  public mostrarCadastro = true;
  formGroup!: FormGroup;
  mensagem: string = '';
  salt: number = 256789; // em caso de erro em calculo de SALT esse numero será utilizado, não e recomendado esta pratica pois em caso de invasão do codigo fonte torna a hash vulneravel

  constructor(
    private fb: FormBuilder,
    private loginService: UsuarioControllerService,
    private cadastroService: UsuarioControllerService
  ) {
      this.createForm();
    }

  createForm() : void {
    this.formGroup = this.fb.group({
      email: ['', Validators.required],
      senha: ['', Validators.required],
    });
  }

    ngOnInit(): void { }

  toggleCadastroLogin() : void {
    this.mostrarCadastro = !this.mostrarCadastro;
  }

  // Função que Criptografa uma string, retornando uma hash segura
  encriptData(data: string): string {
    // Biblioteca Crypto e padrão do node e não precisa ser instalada.

    /* Ressalvas de segurança importantes:

      1 - Maturidade e Manutenção : Desenvolvimento Lento e menos ativo o que pode tornar seus periodos de atualização demorado

      2 - Dependencias: Por ser uma biblioteca bastante extensa ela faz integrações de muitas dependencia o que pode aumentar a chance de conter vulnerabilidade

      3 - Revisões de Codigo: ela não e completamente auditada o que aumenta a probabilidade de falhas de segurança

      4 - Performance: Apresenta menos eficiencia para grandes volumes de dados

    */
    return crypto.SHA256(data).toString();
  }

  // Captura o movimento do mouse, gerando salt aleatorios a cada movimento do mouse
  /*
      1 - Previsibilidade:
              Mouse pode ser previsível.
              Ataque possível se o movimento for controlado.
      2 - Entropia:
              Entropia do mouse pode ser insuficiente.
              Considere fontes adicionais.
      3 - Dependência do Ambiente:
              Funciona apenas em ambientes com mouse.
              Ineficaz em servidores sem mouse.
      4 - Desempenho:
              Impacto no desempenho pode ser significativo.
              Avaliar custo versus benefício.
   */
  @HostListener('document:mousemove', ['$event'])
  async onmousemove(event: MouseEvent) {
    let mouseEntropy = event.clientX + event.clientY;
    let randomSalt = await this.generateRandomSalt();
    this.salt = mouseEntropy ^ randomSalt;
  }

  // Função que gera salt aleatorio
      async generateRandomSalt() {
    if(window.crypto && window.crypto.getRandomValues) {
      let array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      return array[0];
    }
    else {
      // caso a biblioteca assima falhe, usa a biblioteca padrão, não recomendado mas e para evitar do programa de falhar
      return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    }
  }

  onSubmit() : void {
    // tecnica para evitar que o formulario mostre o hash para o usuario, e fique apenas com as informações de login na tela.
    /*
    Este e um importante aspecto da segurança ao esconder a transmissão do hash e do salt para o usuario vc aumenta o nivel de segurança do codigo e impede que possivel hackers tenham acesso
     */
    const usuario: UsuarioDto = {};

    usuario.email = this.encriptData(this.formGroup.get('email')?.value);
    usuario.senha = this.encriptData(this.formGroup.get('senha')?.value);

    if (this.mostrarCadastro) {
          this.cadastroService.cadastro({body: usuario})
            .subscribe((response) => {
              this.mensagem = 'Cadastro realizado com sucesso! Salt:' + this.salt.toString();
            }, error => {
              this.mensagem = 'Erro ao realizar cadastro.';
              console.error(error);
            });
        } else {
          this.loginService.login({body: usuario})
            .subscribe((response) => {
              // Process login success (e.g., redirect)
              this.mensagem = 'Login realizado com sucesso!';
            }, error => {
              this.mensagem = 'Erro ao realizar login.';
              console.error(error);
            });
        }
    }
}
