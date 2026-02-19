import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Product } from '../../product.model';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-admin-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-product-form.component.html',
  styleUrl: './admin-product-form.component.css'
})
export class AdminProductFormComponent implements OnInit {
  isEditMode = false;
  productId: number | null = null;
  loading = false;
  saving = false;
  error = '';
  successMessage = '';

  product: Partial<Product> = {
    name: '',
    description: '',
    price: 0,
    image: '',
    category: '',
    rating: 0,
    stock: 0,
    disabled: false
  };

  categories = ['Electronics', 'Clothing', 'Books', 'Home'];

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.productId = parseInt(idParam, 10);
      this.loadProduct();
    }
  }

  loadProduct(): void {
    if (!this.productId) return;
    this.loading = true;
    this.productService.getProductById(this.productId).subscribe({
      next: (product) => {
        this.product = { ...product };
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load product.';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    this.error = '';
    this.successMessage = '';

    if (!this.product.name?.trim() || !this.product.price) {
      this.error = 'Name and price are required.';
      return;
    }

    this.saving = true;

    if (this.isEditMode && this.productId) {
      this.productService.updateProduct(this.productId, this.product).subscribe({
        next: () => {
          this.successMessage = 'Product updated successfully!';
          this.saving = false;
          setTimeout(() => this.router.navigate(['/admin/products']), 1000);
        },
        error: () => {
          this.error = 'Failed to update product.';
          this.saving = false;
        }
      });
    } else {
      this.productService.createProduct(this.product).subscribe({
        next: () => {
          this.successMessage = 'Product created successfully!';
          this.saving = false;
          setTimeout(() => this.router.navigate(['/admin/products']), 1000);
        },
        error: () => {
          this.error = 'Failed to create product.';
          this.saving = false;
        }
      });
    }
  }
}
